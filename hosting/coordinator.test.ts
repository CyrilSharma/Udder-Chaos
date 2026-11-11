import { test } from "node:test";
import assert from "node:assert/strict";
import { maintain, commitTurn, LEASE_MS, type RoomMeta } from "./protocol.ts";
const hash = "a".repeat(64),
  next = "b".repeat(64);
function room(): RoomMeta {
  return {
    room: "ABC123",
    revision: 2,
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
    solo: true,
    started: true,
    seats: [
      {
        id: "host",
        color: 0,
        name: "Host",
        online: true,
        active: true,
        seen: 1000,
        seq: 2,
        hash,
      },
      {
        id: "guest",
        color: 1,
        name: "Guest",
        online: true,
        active: true,
        seen: 1000,
        seq: 2,
        hash,
      },
    ],
    leader: "host",
    term: 4,
    leaseUntil: 1000 + LEASE_MS,
    seq: 2,
    hash,
    deadline: 1000,
    updated: 1000,
  };
}
test("a lost host transfers its lease only to a replica at the committed state", () => {
  const m = room();
  m.seats[0].online = false;
  assert.equal(maintain(m, 2000), true);
  assert.equal(m.leader, "guest");
  assert.equal(m.term, 5);
  assert.throws(() =>
    commitTurn(
      m,
      "host",
      { term: 4, seq: 3, previous: hash, hash: next },
      2001,
    ),
  );
  commitTurn(m, "guest", { term: 5, seq: 3, previous: hash, hash: next }, 2001);
  assert.equal(m.seq, 3);
});
test("outdated replicas cannot take ownership, and an expired generation cannot commit", () => {
  const m = room();
  m.seats[0].online = false;
  m.seats[1].seq = 1;
  maintain(m, 2000);
  assert.equal(m.leader, null);
  m.seats[1].seq = 2;
  maintain(m, 2100);
  assert.equal(m.leader, "guest");
  assert.throws(() =>
    commitTurn(
      m,
      "guest",
      { term: m.term, seq: 3, previous: hash, hash: next },
      m.leaseUntil,
    ),
  );
});
test("commits cannot skip turns, rewrite history or commit twice", () => {
  const m = room();
  assert.throws(() =>
    commitTurn(
      m,
      "host",
      { term: 4, seq: 4, previous: hash, hash: next },
      2000,
    ),
  );
  assert.throws(() =>
    commitTurn(
      m,
      "host",
      { term: 4, seq: 3, previous: next, hash: next },
      2000,
    ),
  );
  commitTurn(m, "host", { term: 4, seq: 3, previous: hash, hash: next }, 2000);
  assert.throws(() =>
    commitTurn(
      m,
      "host",
      { term: 4, seq: 3, previous: hash, hash: next },
      2000,
    ),
  );
});

test("a commit echo in flight does not churn the host lease", () => {
  const m = room();
  commitTurn(m, "host", { term: 4, seq: 3, previous: hash, hash: next }, 2000);
  assert.equal(maintain(m, 2001), false);
  assert.equal(m.leader, "host");
  assert.equal(m.term, 4);
});
