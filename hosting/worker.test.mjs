import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createHash } from "node:crypto";

// Exercise the actual handlers; only the platform's storage/socket surface is substituted.
const bundled = await build({
  entryPoints: [new URL("./worker.ts", import.meta.url).pathname],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [
    {
      name: "durable-object-platform",
      setup(b) {
        b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
          path: "platform",
          namespace: "test",
        }));
        b.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents:
            "export class DurableObject { constructor(ctx,env) { this.ctx=ctx; this.env=env; } }",
        }));
      },
    },
  ],
});
const {
  Room,
  Directory,
  default: worker,
} = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundled.outputFiles[0].text).toString("base64")
);
const clone = (v) => (v === undefined ? undefined : structuredClone(v));
class Storage {
  data = new Map();
  writes = 0;
  alarms = 0;
  alarm = null;
  fail = false;
  async get(k) {
    if (this.fail) throw Error("SQL unavailable");
    return clone(this.data.get(k));
  }
  async put(k, v) {
    if (this.fail) throw Error("rows_written quota");
    this.writes++;
    this.data.set(k, clone(v));
  }
  async list() {
    if (this.fail) throw Error("SQL unavailable");
    return clone(this.data);
  }
  async delete(keys) {
    for (const k of Array.isArray(keys) ? keys : [keys]) {
      this.writes++;
      this.data.delete(k);
    }
  }
  async deleteAll() {
    this.writes += this.data.size;
    this.data.clear();
  }
  async getAlarm() {
    if (this.fail) throw Error("SQL unavailable");
    return this.alarm;
  }
  async setAlarm(t) {
    if (this.fail) throw Error("rows_written quota");
    this.alarms++;
    this.alarm = t;
  }
}
class Socket {
  readyState = 1;
  messages = [];
  constructor(peer) {
    this.attachment = { peer };
  }
  serializeAttachment(a) {
    this.attachment = clone(a);
  }
  deserializeAttachment() {
    return clone(this.attachment);
  }
  send(s) {
    this.messages.push(JSON.parse(s));
  }
  close() {
    this.readyState = 3;
  }
}
function fixture(t, options = {}) {
  let now = 1_000_000;
  t.mock.method(Date, "now", () => now);
  const ids = ["host", "guest", "blue", "purple"];
  const meta = {
    room: "ABC123",
    revision: 1,
    settings: {
      seed: 0,
      map_id: 0,
      card_deck_size: 15,
      timer_length: 30,
      difficulty: 1000,
      threads: 1,
      rules: {
        hand_size: 3,
        cow_sacrifice: 5,
        cow_regen_rate: 15,
        days_per_round: 5,
        score_goal: 10,
      },
    },
    solo: false,
    started: true,
    seats: ids.map((id, color) => ({
      id,
      color,
      name: id,
      online: true,
      active: true,
      seen: now,
      seq: 0,
      hash: "a".repeat(64),
    })),
    leader: "host",
    term: 1,
    leaseUntil: now + 30_000,
    seq: 0,
    hash: "a".repeat(64),
    deadline: now + 30_000,
    updated: now,
    ...options,
  };
  const sockets = ids.map((id) => new Socket(id)),
    storage = new Storage();
  storage.data.set("meta", clone(meta));
  storage.data.set(
    "tokens",
    Object.fromEntries(ids.map((id) => [id + "-token", id])),
  );
  storage.alarm = now + 86_400_000;
  const auth = Object.fromEntries(
    ids.map((id) => [
      createHash("sha256")
        .update(id + "-token")
        .digest("hex"),
      id,
    ]),
  );
  for (const socket of sockets)
    socket.serializeAttachment({
      peer: socket.attachment.peer,
      meta,
      auth,
      observed: now,
    });
  let ads = 0;
  const ctx = {
    storage,
    ready: Promise.resolve(),
    blockConcurrencyWhile(f) {
      return (this.ready = f());
    },
    getWebSockets(peer) {
      return sockets.filter(
        (s) => s.readyState === 1 && (!peer || s.attachment.peer === peer),
      );
    },
  };
  const env = {
    DIRECTORY: {
      idFromName: (n) => n,
      get: () => ({
        fetch: async () => {
          ads++;
          return Response.json({ ok: true });
        },
      }),
    },
  };
  const room = new Room(ctx, env);
  return {
    room,
    ctx,
    storage,
    sockets,
    meta: room.meta,
    env,
    advance(ms) {
      now += ms;
    },
    ads: () => ads,
  };
}
const beat = (room, ws, active = true, seq = 0, hash = "a".repeat(64)) =>
  room.webSocketMessage(
    ws,
    JSON.stringify({ type: "heartbeat", active, seq, hash }),
  );
const get = (room) =>
  room
    .fetch(
      new Request("https://room/command", {
        method: "POST",
        body: JSON.stringify({
          type: "get",
          room: "ABC123",
          token: "host-token",
        }),
      }),
    )
    .then((r) => r.json());

test("ten minutes of four-player heartbeats write no database rows or alarms, including after hibernation", async (t) => {
  const f = fixture(t);
  await f.ctx.ready;
  for (let round = 0; round < 75; round++) {
    f.advance(8000);
    for (const s of f.sockets) await beat(f.room, s);
  }
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
  assert.equal(f.ads(), 0);
  const restored = new Room(f.ctx, f.env);
  await f.ctx.ready;
  f.advance(8000);
  for (const s of f.sockets) await beat(restored, s);
  const { meta } = await get(restored);
  assert.equal(meta.leader, "host");
  assert.equal(meta.term, 1);
  assert.ok(meta.leaseUntil > Date.now());
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
  assert.ok(JSON.stringify(f.sockets[0].attachment).length < 16384);
});
test("background tabs cannot create a metadata/heartbeat feedback loop, even with old clients", async (t) => {
  const f = fixture(t, { leader: null, leaseUntil: 0 });
  f.meta.seats.forEach((s) => (s.active = false));
  f.storage.data.set("meta", clone(f.meta));
  await f.ctx.ready;
  let processed = 0;
  const pending = [...f.sockets];
  while (pending.length && processed < 50) {
    const ws = pending.shift();
    await beat(f.room, ws, false);
    processed++;
    for (const s of f.sockets)
      for (const m of s.messages.splice(0))
        if (m.type === "meta") pending.push(s);
  }
  assert.equal(pending.length, 0);
  assert.equal(processed, 4);
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
  assert.equal((await get(f.room)).meta.term, 1);
});
test("read-only room/ICE authorization and directory listing do not write", async (t) => {
  const f = fixture(t);
  await f.ctx.ready;
  for (let i = 0; i < 100; i++)
    assert.equal((await get(f.room)).meta.room, "ABC123");
  const ds = new Storage();
  ds.data.set("OLD", { room: "OLD", updated: 0, players: 1, started: false });
  const dir = new Directory({ storage: ds }, {});
  assert.deepEqual(
    await (await dir.fetch(new Request("https://directory/"))).json(),
    [],
  );
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
  assert.equal(f.ads(), 0);
  assert.equal(ds.writes, 0);
});
test("legacy live clients commit without SQL, including when storage is unavailable", async (t) => {
  const f = fixture(t);
  await f.ctx.ready;
  await beat(f.room, f.sockets[0]);
  const commit = {
    type: "commit",
    term: 1,
    seq: 1,
    previous: "a".repeat(64),
    hash: "b".repeat(64),
  };
  await f.room.webSocketMessage(f.sockets[0], JSON.stringify(commit));
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
  assert.equal((await get(f.room)).meta.seq, 1);
  f.storage.fail = true;
  await f.room.webSocketMessage(
    f.sockets[0],
    JSON.stringify({
      ...commit,
      seq: 2,
      previous: commit.hash,
      hash: "c".repeat(64),
    }),
  );
  assert.equal((await get(f.room)).meta.seq, 2);
  assert.equal(f.sockets[0].messages.at(-1).type, "meta");
});
test("host closure restores an ephemeral replacement across hibernation without writes", async (t) => {
  const f = fixture(t);
  await f.ctx.ready;
  f.sockets[0].close();
  await f.room.webSocketClose(f.sockets[0]);
  const { meta } = await get(f.room);
  assert.equal(meta.leader, "guest");
  assert.equal(meta.term, 2);
  assert.equal(f.storage.writes, 0);
  f.advance(8000);
  await beat(f.room, f.sockets[1]);
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
});
test("unstarted lobby advertisements are bounded and stopped once the game starts", async (t) => {
  const f = fixture(t, { started: false });
  await f.ctx.ready;
  for (let i = 0; i < 75; i++) {
    f.advance(8000);
    for (const s of f.sockets) await beat(f.room, s);
  }
  assert.ok(f.ads() <= 10, `advertised ${f.ads()} times`);
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
});

test("solo is a host lobby setting, cannot be enabled with guests, and starts the ordinary game", async (t) => {
  const f = fixture(t, { started: false });
  await f.ctx.ready;
  const request = async (solo) =>
    f.room.fetch(
      new Request("https://room/command", {
        method: "POST",
        body: JSON.stringify({
          type: "configure",
          room: "ABC123",
          token: "host-token",
          name: "host",
          color: 0,
          settings: null,
          solo,
        }),
      }),
    );
  assert.equal((await request(true)).status, 400);
  f.room.meta.seats = f.room.meta.seats.slice(0, 1);
  assert.equal((await request(true)).status, 200);
  assert.equal((await get(f.room)).meta.solo, true);
  assert.equal(
    (
      await f.room.fetch(
        new Request("https://room/command", {
          method: "POST",
          body: JSON.stringify({ type: "join", name: "", token: null }),
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await f.room.fetch(
        new Request("https://room/command", {
          method: "POST",
          body: JSON.stringify({
            type: "start",
            room: "ABC123",
            token: "host-token",
          }),
        }),
      )
    ).status,
    200,
  );
  assert.equal((await get(f.room)).meta.started, true);
});

test("switching every legacy client into the background settles instead of amplifying replies", async (t) => {
  const f = fixture(t);
  await f.ctx.ready;
  const pending = [...f.sockets];
  let processed = 0;
  while (pending.length && processed < 100) {
    const ws = pending.shift();
    await beat(f.room, ws, false);
    processed++;
    for (const socket of f.sockets)
      for (const packet of socket.messages.splice(0))
        if (packet.type === "meta") pending.push(socket);
  }
  assert.equal(pending.length, 0);
  assert.ok(processed <= 36, `processed ${processed}`);
  assert.equal((await get(f.room)).meta.leader, null);
  const writes = f.storage.writes;
  for (const socket of f.sockets) await beat(f.room, socket, false);
  assert.equal(f.storage.writes, writes);
});
test("a legacy turn does not depend on cleanup alarms or available SQL", async (t) => {
  const f = fixture(t);
  await f.ctx.ready;
  f.storage.alarm = Date.now() + 100;
  f.storage.fail = true;
  await f.room.webSocketMessage(
    f.sockets[0],
    JSON.stringify({
      type: "commit",
      term: 1,
      seq: 1,
      previous: "a".repeat(64),
      hash: "b".repeat(64),
    }),
  );
  assert.equal((await get(f.room)).meta.seq, 1);
  assert.equal(f.storage.writes, 0);
});

test("upstream room-service failures become JSON errors instead of uncaught Worker errors", async () => {
  const response = await worker.fetch(new Request("https://game/api/rooms"), {
    DIRECTORY: {
      idFromName: (n) => n,
      get: () => ({
        fetch: async () => {
          throw Error("rows_written quota");
        },
      }),
    },
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "rows_written quota" });
});

test("directory outages cannot reject committed room creation or start", async (t) => {
  t.mock.method(console, "warn", () => {});
  for (const failsWithResponse of [false, true]) {
    const f = fixture(t);
    await f.ctx.ready;
    f.storage.data.clear();
    for (const socket of f.sockets) socket.close();
    f.env.DIRECTORY.get = () => ({
      fetch: async () => {
        if (failsWithResponse)
          return new Response("unavailable", { status: 503 });
        throw Error(
          "Exceeded allowed rows written in Durable Objects free tier.",
        );
      },
    });
    const room = new Room(f.ctx, f.env);
    await f.ctx.ready;
    const create = await room.fetch(
      new Request("https://room/create", {
        method: "POST",
        body: JSON.stringify({
          type: "create",
          room: "ABC123",
          name: "",
          solo: true,
          settings: f.meta.settings,
        }),
      }),
    );
    assert.equal(create.status, 200);
    const { token } = await create.json();
    const start = await room.fetch(
      new Request("https://room/command", {
        method: "POST",
        body: JSON.stringify({ type: "start", room: "ABC123", token }),
      }),
    );
    assert.equal(start.status, 200);
    assert.equal(room.meta.started, true);
    assert.equal(f.storage.writes, 0);
    // A live attachment, not a database record, keeps this session across hibernation.
    const ws = new Socket("live");
    f.sockets.push(ws);
    await room.save();
    const restored = new Room(f.ctx, f.env);
    await f.ctx.ready;
    const read = await restored.fetch(
      new Request("https://room/command", {
        method: "POST",
        body: JSON.stringify({ type: "get", room: "ABC123", token }),
      }),
    );
    assert.equal((await read.json()).meta.started, true);
  }
});

test("failed directory advertisements remain throttled during heartbeats", async (t) => {
  t.mock.method(console, "warn", () => {});
  const f = fixture(t, { started: false });
  await f.ctx.ready;
  let attempts = 0;
  f.env.DIRECTORY.get = () => ({
    fetch: async () => {
      attempts++;
      throw Error("unavailable");
    },
  });
  for (let i = 0; i < 7; i++) {
    await beat(f.room, f.sockets[0]);
    f.advance(8000);
  }
  assert.equal(attempts, 1);
  assert.equal(f.storage.writes, 0);
  assert.ok(f.sockets[0].messages.every((p) => p.type !== "error"));
});

test("a complete new room lifecycle, hibernation and host replacement use no SQL", async (t) => {
  const f = fixture(t);
  await f.ctx.ready;
  for (const ws of f.sockets) ws.close();
  let storageCalls = 0;
  f.ctx.storage = new Proxy(
    {},
    {
      get: () => () => {
        storageCalls++;
        throw Error("SQL must not be used");
      },
    },
  );
  const room = new Room(f.ctx, f.env);
  const command = async (target, c) => {
    const r = await target.fetch(
      new Request(
        c.type === "create" ? "https://room/create" : "https://room/command",
        {
          method: "POST",
          body: JSON.stringify({ ...c, transport: 2 }),
        },
      ),
    );
    assert.equal(r.status, 200, JSON.stringify(await r.clone().json()));
    return r.json();
  };
  const host = await command(room, {
    type: "create",
    transport: 2,
    room: "ABC123",
    name: "",
    solo: false,
    settings: f.meta.settings,
  });
  const unsupported = await room.fetch(
    new Request("https://room/command", {
      method: "POST",
      body: JSON.stringify({
        type: "join",
        room: "ABC123",
        name: "",
        token: null,
      }),
    }),
  );
  assert.equal(unsupported.status, 400);
  assert.match((await unsupported.json()).error, /Refresh/);
  const sessions = [host];
  for (let i = 0; i < 3; i++)
    sessions.push(
      await command(room, {
        type: "join",
        room: "ABC123",
        name: "",
        token: null,
      }),
    );
  for (const s of sessions) f.sockets.push(new Socket(s.peer));
  await room.save();
  await command(room, {
    type: "configure",
    room: "ABC123",
    token: host.token,
    name: "Red",
    settings: null,
    solo: null,
  });
  await command(room, { type: "start", room: "ABC123", token: host.token });
  const authorize = (target) =>
    target.fetch(
      new Request("https://room/ice-authorize", {
        method: "POST",
        body: JSON.stringify({
          type: "get",
          transport: 2,
          room: "ABC123",
          token: host.token,
        }),
      }),
    );
  for (let i = 0; i < 8; i++) assert.equal((await authorize(room)).status, 200);
  assert.equal((await authorize(room)).status, 400);
  for (let i = 0; i < 75; i++) {
    f.advance(8000);
    for (const ws of f.ctx.getWebSockets()) await beat(room, ws);
  }
  const restored = new Room(f.ctx, f.env);
  assert.equal(
    (await authorize(restored)).status,
    400,
    "hibernation retains the in-memory relay limit in connection attachments",
  );
  const read = await command(restored, {
    type: "get",
    room: "ABC123",
    token: host.token,
  });
  assert.equal(read.meta.transport, 2);
  assert.equal(read.meta.started, true);
  for (const ws of f.ctx.getWebSockets()) {
    assert.ok(JSON.stringify(ws.attachment).length < 16384);
    for (const s of sessions)
      assert.ok(!JSON.stringify(ws.attachment).includes(s.token));
  }
  const hostSocket = f.ctx.getWebSockets(host.peer)[0];
  hostSocket.close();
  await restored.webSocketClose(hostSocket);
  assert.equal(restored.meta.leader, sessions[1].peer);
  const oldSeq = restored.meta.seq;
  await restored.webSocketMessage(
    f.ctx.getWebSockets()[0],
    JSON.stringify({
      type: "commit",
      term: restored.meta.term,
      seq: 1,
      hash: "b".repeat(64),
      previous: "a".repeat(64),
    }),
  );
  assert.equal(
    restored.meta.seq,
    oldSeq,
    "new protocol never commits game turns through Cloudflare",
  );
  for (const ws of f.ctx.getWebSockets()) {
    ws.close();
    await restored.webSocketClose(ws);
  }
  f.advance(10_001);
  const gone = await restored.fetch(
    new Request("https://room/command", {
      method: "POST",
      body: JSON.stringify({ type: "get", room: "ABC123", token: host.token }),
    }),
  );
  assert.equal(gone.status, 400);
  assert.equal((await gone.json()).error, "Room not found");
  assert.equal(storageCalls, 0);
});

test("directory discovery expires in memory and rebuilds after eviction without storage", async (t) => {
  let now = 1_000_000,
    calls = 0;
  t.mock.method(Date, "now", () => now);
  const ctx = {
    storage: new Proxy(
      {},
      {
        get: () => () => {
          calls++;
          throw Error("no SQL");
        },
      },
    ),
  };
  const directory = new Directory(ctx, {});
  const ad = {
    room: "ABC123",
    name: "Red",
    players: 1,
    started: false,
    updated: 0,
  };
  const post = (target, value) =>
    target.fetch(
      new Request("https://directory/", {
        method: "POST",
        body: JSON.stringify(value),
      }),
    );
  const list = async (target) =>
    (await target.fetch(new Request("https://directory/"))).json();
  await post(directory, ad);
  assert.equal((await list(directory)).length, 1);
  now += 180001;
  assert.deepEqual(await list(directory), []);
  await post(directory, ad);
  const fresh = new Directory(ctx, {});
  assert.deepEqual(await list(fresh), []);
  await post(fresh, ad);
  assert.equal((await list(fresh)).length, 1);
  await post(fresh, { ...ad, started: true });
  assert.deepEqual(await list(fresh), []);
  await fresh.alarm();
  assert.equal(calls, 0);
});

test("a new device reclaims a disconnected name, rotates credentials, and survives hibernation without SQL", async (t) => {
  const f = fixture(t, { transport: 2 });
  await f.ctx.ready;
  f.storage.fail = true;
  const rejoin = (name) =>
    f.room.fetch(
      new Request("https://room/command", {
        method: "POST",
        body: JSON.stringify({
          type: "rejoin",
          transport: 2,
          name,
          room: "ABC123",
        }),
      }),
    );
  assert.equal((await rejoin("guest")).status, 400);
  f.sockets[1].close();
  await f.room.webSocketClose(f.sockets[1]);
  const responses = await Promise.all([rejoin(null), rejoin("guest")]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
  const reply = await responses.find((r) => r.ok).json();
  assert.equal(reply.peer, "guest");
  assert.equal(reply.meta.seats.length, 4);
  assert.equal(reply.meta.seats[1].color, 1);
  const read = async (target, token) =>
    await target.fetch(
      new Request("https://room/command", {
        method: "POST",
        body: JSON.stringify({
          type: "get",
          transport: 2,
          room: "ABC123",
          token,
        }),
      }),
    );
  assert.equal((await read(f.room, "guest-token")).status, 400);
  assert.equal((await read(f.room, reply.token)).status, 200);
  // A delayed close from the old device cannot mark its replacement disconnected.
  await f.room.webSocketClose(f.sockets[1]);
  assert.equal(f.room.meta.seats[1].online, true);
  const restored = new Room(f.ctx, f.env);
  await f.ctx.ready;
  assert.equal((await read(restored, reply.token)).status, 200);
  assert.equal(f.storage.writes, 0);
  assert.equal(f.storage.alarms, 0);
});

test("name rejoin rejects unknown and ambiguous offline names without claiming an arbitrary color", async (t) => {
  const f = fixture(t, { transport: 2 });
  await f.ctx.ready;
  const attempt = async (name) =>
    (
      await f.room.fetch(
        new Request("https://room/command", {
          method: "POST",
          body: JSON.stringify({
            type: "rejoin",
            transport: 2,
            name,
            room: "ABC123",
          }),
        }),
      )
    ).json();
  assert.match((await attempt("nobody")).error, /No disconnected/);
  f.room.meta.seats[1].name = "Same";
  f.room.meta.seats[2].name = "same";
  f.sockets[1].close();
  f.sockets[2].close();
  await f.room.webSocketClose(f.sockets[1]);
  await f.room.webSocketClose(f.sockets[2]);
  assert.match((await attempt(null)).error, /Enter your name/);
  assert.match((await attempt(" SAME ")).error, /More than one/);
  assert.equal(Object.keys(f.room.tokens).length, 4);
});

test("rejoin cannot restart a game after its last checkpoint holder left", async (t) => {
  const f = fixture(t, { transport: 2, solo: true });
  await f.ctx.ready;
  f.room.meta.seats = f.room.meta.seats.slice(0, 1);
  for (const ws of f.sockets) ws.close();
  await f.room.webSocketClose(f.sockets[0]);
  const response = await f.room.fetch(
    new Request("https://room/command", {
      method: "POST",
      body: JSON.stringify({
        type: "rejoin",
        transport: 2,
        room: "ABC123",
        name: null,
      }),
    }),
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "Everyone left this game");
});

test('connected inactive lobby owners retain ownership and new joins get a distinct color',async t=>{
  const f=fixture(t,{started:false,transport:2});await f.ctx.ready;
  f.room.meta.seats=f.room.meta.seats.slice(0,1);
  for(const ws of f.sockets.slice(1))ws.close();
  f.advance(120000);
  await beat(f.room,f.sockets[0],false);
  assert.equal(f.room.meta.leader,'host');
  assert.equal(f.room.meta.term,1);
  const response=await f.room.fetch(new Request('https://room/command',{method:'POST',body:JSON.stringify({type:'join',transport:2,room:'ABC123',name:'',token:null})}));
  const joined=await response.json();
  assert.equal(response.status,200);assert.notEqual(joined.peer,'host');
  const seat=joined.meta.seats.find(s=>s.id===joined.peer);
  assert.equal(seat.color,1);assert.equal(seat.name,'Yellow');
  assert.equal(joined.meta.leader,'host');assert.equal(f.storage.writes,0);
});

test('ordinary Join automatically reclaims one disconnected seat and only asks a name for multiple seats',async t=>{
  const f=fixture(t,{transport:2});await f.ctx.ready;
  const join=()=>f.room.fetch(new Request('https://room/command',{method:'POST',body:JSON.stringify({type:'join',transport:2,room:'ABC123',name:'',token:null})}));
  f.sockets[1].close();await f.room.webSocketClose(f.sockets[1]);
  const recovered=await (await join()).json();assert.equal(recovered.peer,'guest');assert.equal(recovered.meta.seats.length,4);
  f.sockets[2].close();f.sockets[3].close();await f.room.webSocketClose(f.sockets[2]);await f.room.webSocketClose(f.sockets[3]);
  const ambiguous=await join();assert.equal(ambiguous.status,400);assert.equal((await ambiguous.json()).error,'Enter your name to rejoin');
  assert.equal(f.storage.writes,0);
});
