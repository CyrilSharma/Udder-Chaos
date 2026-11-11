import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const bundled = await build({
  entryPoints: [
    new URL("../frontend/src/multiplayer/client.ts", import.meta.url).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
  plugins: [
    {
      name: "protocol-platform",
      setup(b) {
        b.onResolve({ filter: /^\.\/(engine|mesh)$/ }, (a) => ({
          path: a.path.slice(2),
          namespace: "test",
        }));
        b.onLoad({ filter: /.*/, namespace: "test" }, (a) => ({
          contents: `export class ${
            a.path === "engine" ? "Engine" : "Mesh"
          } {constructor(){throw Error('Use the test transport/engine');}}`,
        }));
      },
    },
  ],
});
const { PeerClient } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundled.outputFiles[0].text).toString("base64")
);
for (const name of ["window", "document", "sessionStorage"])
  Object.defineProperty(globalThis, name, {
    value: {},
    writable: true,
    configurable: true,
  });
const hash = (n) => n.toString(16).padStart(64, "0");
class Engine {
  value = 0;
  pending = null;
  result() {
    return {
      game: { turn: this.value, player_id: 0, winner: null },
      frames: [],
      hash: hash(this.value),
      checkpoint: { value: this.value },
    };
  }
  async call(r) {
    if (r.type === "init") this.value = 0;
    if (r.type === "prepare") {
      this.pending = this.value + 1;
      return { ...this.result(), hash: hash(this.pending) };
    }
    if (r.type === "commit") {
      assert.notEqual(this.pending, null);
      this.value = this.pending;
      this.pending = null;
    }
    if (r.type === "discard") this.pending = null;
    if (r.type === "restore") {
      this.value = r.checkpoint.value;
      this.pending = null;
    }
    return this.result();
  }
}
async function network(t) {
  t.mock.property(globalThis, "window", {
    setTimeout: () => 0,
    clearTimeout() {},
    clearInterval() {},
  });
  t.mock.property(globalThis, "document", { visibilityState: "visible" });
  t.mock.property(globalThis, "sessionStorage", { setItem() {} });
  const ids = ["host", "guest", "third"],
    clients = new Map(),
    queue = [],
    sent = [],
    cloudflare = [];
  const meta = {
    transport: 2,
    room: "ABC123",
    revision: 2,
    started: true,
    solo: false,
    settings: { seed: 0, timer_length: 30 },
    seq: 0,
    hash: null,
    deadline: Date.now() + 30000,
    leader: "host",
    term: 1,
    leaseUntil: Date.now() + 30000,
    seats: ids.map((id, color) => ({
      id,
      color,
      name: id,
      online: true,
      active: true,
      seen: Date.now(),
      seq: 0,
      hash: null,
    })),
  };
  for (const id of ids) {
    const c = new PeerClient();
    c.peer = id;
    c.session = { room: "ABC123", token: id };
    c.engine = new Engine();
    c.meta = structuredClone(meta);
    c.sendRoom = (p) => cloudflare.push({ from: id, ...structuredClone(p) });
    c.mesh = {
      has: (to) => clients.has(to),
      ensure() {},
      send: async (to, p) => {
        const item = { from: id, to, packet: structuredClone(p) };
        sent.push(item);
        queue.push(item);
      },
    };
    clients.set(id, c);
  }
  async function deliver(item) {
    const target = clients.get(item.to);
    if (target && clients.has(item.from))
      await target.receive(item.from, item.packet);
  }
  async function flush(until = () => false) {
    let count = 0;
    while (queue.length && !until()) {
      assert.ok(count++ < 500, "protocol must settle");
      await deliver(queue.shift());
    }
  }
  for (const c of clients.values()) await c.acceptMeta(structuredClone(meta));
  await flush();
  async function loseHost() {
    clients.delete("host");
    const next = {
      ...structuredClone(meta),
      leader: "guest",
      term: 2,
      revision: 3,
    };
    next.seats[0].online = false;
    for (const c of clients.values()) await c.acceptMeta(structuredClone(next));
  }
  return { clients, queue, sent, cloudflare, meta, flush, deliver, loseHost };
}

test("prepared turns commit between peers without Cloudflare game packets", async (t) => {
  const n = await network(t),
    host = n.clients.get("host");
  assert.ok([...n.clients.values()].every((c) => c.ready()));
  await host.propose({ type: "play", card: 0, color: 0 });
  await n.flush();
  assert.ok(
    [...n.clients.values()].every((c) => c.seq === 1 && c.hash === hash(1)),
  );
  assert.ok(n.sent.some((p) => p.packet.type === "peer-commit"));
  assert.ok(
    n.cloudflare.every(
      (p) => p.type === "heartbeat" && !("seq" in p) && !("hash" in p),
    ),
  );
  assert.ok([...n.clients.values()].every((c) => c.ready()));
});

test("a replacement host recovers the highest committed checkpoint from a surviving peer", async (t) => {
  const n = await network(t),
    host = n.clients.get("host");
  await host.propose({ type: "play", card: 0, color: 0 });
  await n.flush(() => host.seq === 1);
  const index = n.queue.findIndex(
    (p) => p.to === "third" && p.packet.type === "peer-commit",
  );
  await n.deliver(n.queue.splice(index, 1)[0]);
  assert.equal(n.clients.get("third").seq, 1);
  assert.equal(n.clients.get("guest").seq, 0);
  await n.loseHost();
  await n.flush();
  assert.ok(
    [...n.clients.values()].every(
      (c) => c.seq === 1 && c.hash === hash(1) && c.ready(),
    ),
  );
  await n.clients.get("guest").propose({ type: "play", card: 0, color: 0 });
  await n.flush();
  assert.ok(
    [...n.clients.values()].every((c) => c.seq === 2 && c.hash === hash(2)),
  );
});

test("host loss before a commit discards preparations and permits retry", async (t) => {
  const n = await network(t);
  await n.clients.get("host").propose({ type: "play", card: 0, color: 0 });
  // Deliver prepares, but lose the host before its acknowledgements can commit.
  await n.deliver(n.queue.shift());
  await n.deliver(n.queue.shift());
  await n.loseHost();
  await n.flush();
  assert.ok(
    [...n.clients.values()].every(
      (c) => c.seq === 0 && c.engine.pending === null && c.ready(),
    ),
  );
  await n.clients.get("guest").propose({ type: "play", card: 0, color: 0 });
  await n.flush();
  assert.ok([...n.clients.values()].every((c) => c.seq === 1));
});

test("rejoining during an uncommitted move cancels stale acknowledgements and permits retry", async (t) => {
  const n = await network(t);
  await n.clients.get("host").propose({ type: "play", card: 0, color: 0 });
  await n.deliver(n.queue.shift());
  await n.deliver(n.queue.shift());
  n.queue.length = 0;
  for (const c of n.clients.values())
    await c.acceptMeta({ ...structuredClone(n.meta), revision: 3 });
  await n.flush();
  assert.ok(
    [...n.clients.values()].every(
      (c) => !c.proposal && c.engine.pending === null && c.ready(),
    ),
  );
  await n.clients.get("host").propose({ type: "play", card: 0, color: 0 });
  await n.flush();
  assert.ok([...n.clients.values()].every((c) => c.seq === 1));
});

test("stale host commits and conflicting peer heads cannot advance the game", async (t) => {
  const n = await network(t);
  await n.loseHost();
  await n.flush();
  const c = n.clients.get("guest");
  await c.receive("third", {
    type: "peer-commit",
    term: 1,
    seq: 1,
    previous: hash(0),
    hash: hash(1),
  });
  assert.equal(c.seq, 0);
  await assert.rejects(
    c.receive("third", {
      type: "peer-head",
      term: 2,
      seq: 0,
      hash: "f".repeat(64),
    }),
    /disagree/,
  );
  assert.equal(c.ready(), false);
  await assert.rejects(
    c.propose({ type: "play", card: 0, color: 0 }),
    /Waiting/,
  );
});

test("bad checkpoint hashes roll the engine back and room metadata cannot rewind a peer game", async (t) => {
  const n = await network(t),
    host = n.clients.get("host");
  await assert.rejects(
    host.receive("guest", {
      type: "peer-sync",
      term: 1,
      seq: 4,
      hash: "f".repeat(64),
      checkpoint: { value: 4 },
    }),
    /does not match/,
  );
  assert.equal(host.engine.value, 0);
  assert.equal(host.seq, 0);
  await host.propose({ type: "play", card: 0, color: 0 });
  await n.flush();
  const playbackRevision = host.snapshot().revision;
  await host.acceptMeta({ ...structuredClone(n.meta), revision: 3 });
  await n.flush();
  assert.equal(
    host.snapshot().revision,
    playbackRevision,
    "presence updates cannot replay committed animation frames",
  );
  assert.equal(host.seq, 1);
  assert.equal(host.meta.seq, 1);
  assert.equal(host.hash, hash(1));
});

test("a replacement device cannot serve or play an unverified initial state", async (t) => {
  const n = await network(t),
    c = n.clients.get("guest");
  c.needsPeerCheckpoint = true;
  assert.equal(c.ready(), false);
  const before = n.sent.length;
  await c.sendCheckpoint("host");
  assert.equal(n.sent.length, before);
  await c.receive("host", {
    type: "peer-head",
    term: 1,
    seq: 0,
    hash: hash(0),
  });
  assert.equal(
    c.ready(),
    false,
    "a head announcement alone is not a saved checkpoint",
  );
  await c.receive("host", {
    type: "peer-sync",
    term: 1,
    seq: 0,
    hash: hash(0),
    checkpoint: { value: 0 },
  });
  assert.equal(c.ready(), true);
});
