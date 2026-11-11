import { DurableObject } from "cloudflare:workers";
import { maintain, commitTurn, LEASE_MS, type RoomMeta } from "./protocol";
import type { Settings, Command } from "../frontend/src/protocol";
interface Env {
  ROOMS: DurableObjectNamespace<Room>;
  DIRECTORY: DurableObjectNamespace<Directory>;
  ASSETS: Fetcher;
  TURN_KEY_ID?: string;
  TURN_API_TOKEN?: string;
}
const json = (value: unknown, status = 200) => Response.json(value, { status });
const ADVERTISE_MS = 60_000;
const LISTING_MS = 180_000;
async function sessionKey(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
type Advertisement = {
  room: string;
  name: string;
  updated: number;
  started: boolean;
  players: number;
};
type Attachment = {
  peer: string;
  session?: string;
  meta?: RoomMeta;
  observed?: number;
  advertisedAt?: number;
  auth?: Record<string, string>;
  ice?: Record<string, { hour: number; count: number }>;
};
const cleanName = (value: unknown, fallback?: string) => {
  if (typeof value === "string" && !value.trim() && fallback) return fallback;
  if (typeof value !== "string" || !value.trim() || value.trim().length > 24)
    throw Error("Names must contain 1–24 characters");
  return value.trim();
};
function validate(s: Settings) {
  if (
    !s ||
    !Number.isInteger(s.seed) ||
    s.seed < 0 ||
    s.seed > 4294967295 ||
    !Number.isInteger(s.map_id) ||
    s.map_id < 0 ||
    s.map_id > 2 ||
    !Number.isInteger(s.card_deck_size) ||
    s.card_deck_size <= 2 * s.rules?.hand_size ||
    s.card_deck_size > 128 ||
    !Number.isInteger(s.timer_length) ||
    s.timer_length < 5 ||
    s.timer_length > 3600 ||
    !Number.isInteger(s.difficulty) ||
    s.difficulty < 1 ||
    s.difficulty > 3000 ||
    s.threads !== 1 ||
    s.rules.hand_size < 1 ||
    s.rules.hand_size > 8 ||
    ![s.rules.cow_regen_rate, s.rules.days_per_round, s.rules.score_goal].every(
      (n) => Number.isInteger(n) && n > 0 && n <= 10000,
    ) ||
    !Number.isInteger(s.rules.cow_sacrifice) ||
    s.rules.cow_sacrifice < 0
  )
    throw Error("Invalid browser game settings (one AI worker is supported)");
}
export class Directory extends DurableObject<Env> {
  private rooms = new Map<string, Advertisement>();
  async fetch(request: Request) {
    const now = Date.now();
    for (const [id, room] of this.rooms)
      if (now - room.updated > LISTING_MS) this.rooms.delete(id);
    if (request.method === "POST") {
      const room = (await request.json()) as Advertisement;
      if (room.started || room.players === 0) this.rooms.delete(room.room);
      else this.rooms.set(room.room, { ...room, updated: now });
      return json({ ok: true });
    }
    return json(
      [...this.rooms.values()].filter((r) => r.players > 0 && r.players < 4),
    );
  }
  // Retire alarms left by the former persistent directory; never schedule another.
  async alarm() {}
}
export class Room extends DurableObject<Env> {
  private meta!: RoomMeta;
  private tokens: Record<string, string> = {};
  private attachmentClock = 0;
  private advertisedAt = 0;
  private expired = false;
  private closedAt = 0;
  private ice: Record<string, { hour: number; count: number }> = {};
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const sockets = ctx.getWebSockets().filter((ws) => ws.readyState === 1);
    const snapshots = sockets
      .map((ws) => ws.deserializeAttachment() as Attachment | null)
      .filter((a): a is Attachment => !!a?.meta)
      .sort((a, b) => (b.observed ?? 0) - (a.observed ?? 0));
    const latest = snapshots[0];
    if (!latest) return;
    if (latest.auth) {
      this.restore(latest, sockets);
      for (const ws of sockets) this.remember(ws);
    } else {
      // One-time read compatibility for pre-update connections. New rooms never access SQL.
      ctx.blockConcurrencyWhile(async () => {
        const saved = await ctx.storage.get<{
          meta: RoomMeta;
          tokens: Record<string, string>;
        }>("state");
        const raw =
          saved?.tokens ??
          (await ctx.storage.get<Record<string, string>>("tokens")) ??
          {};
        const auth: Record<string, string> = {};
        for (const [token, peer] of Object.entries(raw))
          auth[await sessionKey(token)] = peer;
        this.restore({ ...latest, auth }, sockets);
        await this.save();
      });
    }
  }
  private restore(snapshot: Attachment, sockets: WebSocket[]) {
    this.meta = snapshot.meta!;
    this.tokens = snapshot.auth!;
    this.ice = snapshot.ice ?? {};
    this.attachmentClock = snapshot.observed ?? 0;
    this.advertisedAt = snapshot.advertisedAt ?? 0;
    const connected = new Set(
      sockets.map((ws) => (ws.deserializeAttachment() as Attachment).peer),
    );
    for (const seat of this.meta.seats)
      if (!connected.has(seat.id)) seat.online = false;
  }
  private async save() {
    // Attachments survive hibernation only while a connection exists. No database writes.
    for (const ws of this.ctx.getWebSockets())
      if (ws.readyState === 1) this.remember(ws);
  }
  private disconnected(seat: RoomMeta["seats"][number]) {
    if (
      !this.meta.started &&
      this.ctx.getWebSockets(seat.id).some((ws) => ws.readyState === 1)
    )
      return false;
    return !seat.online || Date.now() - seat.seen >= LEASE_MS;
  }
  private remember(ws: WebSocket) {
    const attachment = ws.deserializeAttachment() as Attachment;
    const { peer } = attachment;
    const session =
      attachment.session ??
      Object.keys(this.tokens).find((key) => this.tokens[key] === peer);
    this.attachmentClock = Math.max(Date.now(), this.attachmentClock + 1);
    ws.serializeAttachment({
      peer,
      session,
      meta: this.meta,
      observed: this.attachmentClock,
      advertisedAt: this.advertisedAt,
      auth: this.tokens,
      ice: this.ice,
    } satisfies Attachment);
  }
  private broadcast() {
    for (const ws of this.ctx.getWebSockets())
      try {
        this.remember(ws);
        ws.send(
          JSON.stringify({ type: "meta", meta: this.meta, now: Date.now() }),
        );
      } catch {}
  }
  private async advertise() {
    this.advertisedAt = Date.now();
    // Discovery is best-effort: it must not reject an already committed room command.
    // Record the attempt before calling, so an unavailable directory is still throttled.
    try {
      const response = await this.env.DIRECTORY.get(
        this.env.DIRECTORY.idFromName("directory"),
      ).fetch("https://directory/", {
        method: "POST",
        body: JSON.stringify({
          room: this.meta.room,
          name: this.meta.seats[0]?.name ?? "Room",
          players: this.meta.seats.filter((s) => s.online).length,
          started: this.meta.started || this.meta.solo,
          updated: Date.now(),
        }),
      });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn(
        "Room directory advertisement failed",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  async fetch(request: Request): Promise<Response> {
    try {
      if (this.closedAt && Date.now() - this.closedAt >= 10_000) {
        this.meta = undefined!;
        this.tokens = {};
        this.ice = {};
        this.expired = true;
      }
      const url = new URL(request.url);
      if (url.pathname === "/create") {
        if (this.meta) throw Error("Room exists");
        this.expired = false;
        this.closedAt = 0;
        const c = (await request.json()) as Command & {
          type: "create";
          room: string;
          transport?: 2;
        };
        validate(c.settings);
        const token = crypto.randomUUID(),
          id = crypto.randomUUID(),
          now = Date.now();
        this.tokens[await sessionKey(token)] = id;
        this.meta = {
          room: c.room,
          transport: c.transport,
          revision: 1,
          settings: c.settings,
          solo: c.solo,
          started: false,
          seats: [
            {
              id,
              name: cleanName(c.name, "Red"),
              color: 0,
              online: true,
              active: true,
              seen: now,
              seq: 0,
              hash: null,
            },
          ],
          leader: id,
          term: 1,
          leaseUntil: now + LEASE_MS,
          seq: 0,
          hash: null,
          deadline: 0,
          updated: now,
        };
        await this.save();
        await this.advertise();
        return json({ meta: this.meta, token, peer: id });
      }
      if (!this.meta) throw Error("Room not found");
      if (url.pathname === "/socket") {
        const token = url.searchParams.get("token") ?? "",
          session = await sessionKey(token),
          peer = this.tokens[session];
        if (!peer) throw Error("Invalid session");
        if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket")
          return new Response("WebSocket required", { status: 426 });
        const pair = new WebSocketPair(),
          client = pair[0],
          server = pair[1];
        this.ctx.acceptWebSocket(server, [peer]);
        this.closedAt = 0;
        server.serializeAttachment({ peer, session });
        const seat = this.meta.seats.find((s) => s.id === peer)!;
        seat.online = true;
        seat.seen = Date.now();
        server.send(
          JSON.stringify({ type: "meta", meta: this.meta, now: Date.now() }),
        );
        for (const socket of this.ctx.getWebSockets())
          if (socket !== server)
            socket.send(JSON.stringify({ type: "peer-online", peer }));
        this.broadcast();
        return new Response(null, { status: 101, webSocket: client });
      }
      let c = (await request.json()) as Command & { transport?: 2 };
      if (this.meta.transport === 2 && c.transport !== 2)
        throw Error("Refresh the game to join this room");
      if (
        c.type === "join" &&
        !c.token &&
        this.meta.seats.some((s) => this.disconnected(s))
      )
        c = {
          type: "rejoin",
          room: c.room,
          name: null,
          transport: c.transport,
        };
      if (c.type === "rejoin") {
        const token = crypto.randomUUID();
        const key = await sessionKey(token);
        const wanted = c.name == null ? null : cleanName(c.name).toLowerCase();
        const matches = this.meta.seats.filter(
          (s) => wanted === null || s.name.toLowerCase() === wanted,
        );
        const available = matches.filter((s) => this.disconnected(s));
        if (!available.length)
          throw Error(
            matches.length
              ? "That player is still connected"
              : "No disconnected player has that name",
          );
        if (available.length !== 1)
          throw Error(
            wanted === null
              ? "Enter your name to rejoin"
              : "More than one disconnected player has that name",
          );
        const seat = available[0];
        if (
          this.meta.started &&
          !this.ctx
            .getWebSockets()
            .some(
              (ws) =>
                ws.readyState === 1 &&
                (ws.deserializeAttachment() as Attachment).peer !== seat.id,
            )
        )
          throw Error("Everyone left this game");
        // Issue a new device credential and revoke every credential for the old device.
        for (const [key, peer] of Object.entries(this.tokens))
          if (peer === seat.id) delete this.tokens[key];
        for (const ws of this.ctx.getWebSockets(seat.id))
          ws.close(4001, "Session moved");
        this.tokens[key] = seat.id;
        seat.online = true;
        seat.active = true;
        seat.seen = Date.now();
        this.meta.revision++;
        await this.save();
        this.broadcast();
        await this.advertise();
        return json({ meta: this.meta, token, peer: seat.id });
      }
      if (c.type === "join") {
        let token = c.token,
          peer = token ? this.tokens[await sessionKey(token)] : undefined;
        if (token && !peer) throw Error("Invalid session");
        if (!peer) {
          if (
            this.meta.started ||
            this.meta.solo ||
            this.meta.seats.length >= 4
          )
            throw Error("Room is full or already started");
          token = crypto.randomUUID();
          peer = crypto.randomUUID();
          this.tokens[await sessionKey(token)] = peer;
          const used = new Set(this.meta.seats.map((s) => s.color));
          const color = [0, 1, 2, 3].find((c) => !used.has(c))!;
          this.meta.seats.push({
            id: peer,
            name: cleanName(c.name, ["Red", "Yellow", "Blue", "Purple"][color]),
            color,
            online: true,
            active: true,
            seen: Date.now(),
            seq: 0,
            hash: null,
          });
          this.meta.revision++;
        }
        await this.save();
        this.broadcast();
        await this.advertise();
        return json({ meta: this.meta, token, peer });
      }
      if (!("token" in c)) throw Error("Invalid request");
      const peer = this.tokens[await sessionKey(c.token)],
        seat = this.meta.seats.find((s) => s.id === peer);
      if (!peer || !seat) throw Error("Invalid session");
      if (url.pathname === "/ice-authorize") {
        const key = `ice:${peer}`,
          now = Date.now();
        const attempts = this.ice[key] ?? { hour: now, count: 0 };
        if (now - attempts.hour > 3600000) {
          attempts.hour = now;
          attempts.count = 0;
        }
        if (attempts.count >= 8) throw Error("Relay credential limit reached");
        attempts.count++;
        this.ice[key] = attempts;
        await this.save();
        return json({ ok: true });
      }
      if (c.type === "configure") {
        const nextName = cleanName(c.name);
        if (
          c.solo != null &&
          (typeof c.solo !== "boolean" ||
            this.meta.leader !== peer ||
            this.meta.started ||
            (c.solo && this.meta.seats.length !== 1))
        )
          throw Error("Only the host of an empty lobby can enable solo mode");
        if (c.settings) {
          if (this.meta.leader !== peer || this.meta.started)
            throw Error("Only the lobby host can change settings");
          validate(c.settings);
        }
        seat.name = nextName;
        if (c.solo != null) this.meta.solo = c.solo;
        if (c.settings) this.meta.settings = c.settings;
        this.meta.revision++;
      } else if (c.type === "start") {
        if (this.meta.leader !== peer) throw Error("Only the host can start");
        if (this.meta.started) throw Error("Game already started");
        if (!this.meta.solo && this.meta.seats.length !== 4)
          throw Error("Four players are required");
        this.meta.started = true;
        seat.active = true;
        seat.seen = Date.now();
        this.meta.leaseUntil = Date.now() + LEASE_MS;
        this.meta.revision++;
        this.meta.deadline =
          Date.now() + this.meta.settings.timer_length * 1000;
      } else if (c.type === "leave") {
        seat.online = false;
        seat.active = false;
        for (const ws of this.ctx.getWebSockets(peer))
          ws.close(1000, "Left room");
        if (!this.meta.started) {
          this.meta.seats = this.meta.seats.filter((s) => s.id !== peer);
          delete this.tokens[await sessionKey(c.token)];
        }
        maintain(this.meta, Date.now());
        this.meta.revision++;
      } else if (c.type !== "get") throw Error("Gameplay is peer-to-peer");
      if (c.type === "get") return json({ meta: this.meta, peer });
      await this.save();
      this.broadcast();
      await this.advertise();
      return json({ meta: this.meta, peer });
    } catch (error) {
      return json(
        { error: String(error instanceof Error ? error.message : error) },
        400,
      );
    }
  }
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      if (typeof message !== "string" || message.length > 96_000)
        throw Error("Message too large");
      const p = JSON.parse(message),
        { peer, session } = ws.deserializeAttachment() as Attachment;
      if (session && this.tokens[session] !== peer)
        throw Error("Invalid session");
      const seat = this.meta.seats.find((s) => s.id === peer);
      if (!seat) throw Error("Invalid session");
      if (p.type === "signal") {
        if (
          typeof p.to !== "string" ||
          !p.signal ||
          JSON.stringify(p.signal).length > 80_000
        )
          throw Error("Invalid signal");
        for (const target of this.ctx.getWebSockets(p.to))
          target.send(
            JSON.stringify({ type: "signal", from: peer, signal: p.signal }),
          );
        return;
      }
      if (p.type === "heartbeat") {
        const presence = this.meta.seats
          .map((s) => `${s.id}:${s.online}:${s.active}`)
          .join();
        seat.seen = Date.now();
        seat.online = true;
        seat.active = !!p.active;
        if (!this.meta.started) {
          // A lobby owner need not keep its tab foregrounded to retain the lobby.
          const connected = new Set(
            this.ctx
              .getWebSockets()
              .filter((ws) => ws.readyState === 1)
              .map((ws) => (ws.deserializeAttachment() as Attachment).peer),
          );
          for (const s of this.meta.seats)
            if (connected.has(s.id)) {
              s.online = true;
              s.seen = Date.now();
            }
        }
        if (this.meta.transport !== 2) {
          seat.seq = Number.isInteger(p.seq) ? p.seq : -1;
          seat.hash = typeof p.hash === "string" ? p.hash : null;
        }
        if (this.meta.leader === peer && (seat.active || !this.meta.started))
          this.meta.leaseUntil = Date.now() + LEASE_MS;
        const changed = maintain(this.meta, Date.now());
        ws.send(
          JSON.stringify({
            type: "lease",
            now: Date.now(),
            term: this.meta.term,
            leaseUntil: this.meta.leaseUntil,
          }),
        );
        if (changed) {
          await this.save();
          this.broadcast();
        } else if (
          presence !==
          this.meta.seats.map((s) => `${s.id}:${s.online}:${s.active}`).join()
        )
          this.broadcast();
        if (
          !this.meta.started &&
          this.meta.leader &&
          Date.now() - this.advertisedAt >= ADVERTISE_MS
        ) {
          await this.advertise();
        }
        this.remember(ws);
        return;
      }
      if (p.type === "commit") {
        if (this.meta.transport === 2) throw Error("Turns are peer-to-peer");
        commitTurn(this.meta, peer, p, Date.now());
        await this.save();
        this.broadcast();
        return;
      }
      throw Error("Unknown room message");
    } catch (error) {
      ws.send(
        JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
  async webSocketClose(ws: WebSocket) {
    if (!this.meta || this.expired) return;
    const { peer, session } = ws.deserializeAttachment() as Attachment;
    if (session && this.tokens[session] !== peer) return;
    if (
      !this.ctx.getWebSockets(peer).some((s) => s !== ws && s.readyState === 1)
    ) {
      const seat = this.meta.seats.find((s) => s.id === peer);
      if (seat) seat.online = false;
      const changed = maintain(this.meta, Date.now());
      const empty = !this.ctx
        .getWebSockets()
        .some((socket) => socket.readyState === 1);
      if (empty) {
        // A short in-memory grace window permits refresh/reconnection, not saved games.
        await this.advertise();
        this.closedAt = Date.now();
        return;
      }
      if (changed) await this.save();
      this.broadcast();
    }
  }
  // Old cleanup alarms may fire once after deployment; new sessions schedule none.
  async alarm() {}
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/rooms" && request.method === "GET")
        return await env.DIRECTORY.get(
          env.DIRECTORY.idFromName("directory"),
        ).fetch(request);
      const socket = url.pathname.match(
        /^\/api\/rooms\/([A-F0-9]{6})\/socket$/,
      );
      if (socket) {
        url.pathname = "/socket";
        return await env.ROOMS.get(env.ROOMS.idFromName(socket[1])).fetch(
          new Request(url, request),
        );
      }
      if (url.pathname === "/api/command" && request.method === "POST") {
        const c = (await request.json()) as Command;
        const room =
          c.type === "create"
            ? crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()
            : "room" in c
            ? c.room.toUpperCase()
            : "";
        if (!/^[A-F0-9]{6}$/.test(room)) throw Error("Invalid room code");
        return await env.ROOMS.get(env.ROOMS.idFromName(room)).fetch(
          `https://room/${c.type === "create" ? "create" : "command"}`,
          { method: "POST", body: JSON.stringify({ ...c, room }) },
        );
      }
      if (url.pathname === "/api/ice") {
        if (request.method !== "POST")
          return json({ error: "POST required" }, 405);
        const session = (await request.json()) as {
          room: string;
          token: string;
        };
        if (
          typeof session.room !== "string" ||
          typeof session.token !== "string" ||
          !/^[A-F0-9]{6}$/.test(session.room)
        )
          return json({ error: "Invalid session" }, 403);
        const auth = await env.ROOMS.get(
          env.ROOMS.idFromName(session.room),
        ).fetch(
          env.TURN_KEY_ID && env.TURN_API_TOKEN
            ? "https://room/ice-authorize"
            : "https://room/command",
          {
            method: "POST",
            body: JSON.stringify({ type: "get", transport: 2, ...session }),
          },
        );
        if (!auth.ok)
          return json(
            { error: "Invalid session or relay credential limit" },
            403,
          );
        if (env.TURN_KEY_ID && env.TURN_API_TOKEN) {
          const result = await fetch(
            `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.TURN_API_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ttl: 86400 }),
            },
          );
          if (result.ok)
            return new Response(result.body, {
              headers: {
                "Content-Type": "application/json",
                "Cache-Control": "private, max-age=300",
              },
            });
        }
        return json({
          iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }],
        });
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : String(error) },
        400,
      );
    }
  },
};
