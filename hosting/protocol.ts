import type { Settings } from "../frontend/src/protocol";
export type Seat = {
  id: string;
  name: string;
  color: number;
  online: boolean;
  active: boolean;
  seen: number;
  seq: number;
  hash: string | null;
};
export type RoomMeta = {
  transport?: 2;
  room: string;
  revision: number;
  settings: Settings;
  solo: boolean;
  started: boolean;
  seats: Seat[];
  leader: string | null;
  term: number;
  leaseUntil: number;
  seq: number;
  hash: string | null;
  deadline: number;
  updated: number;
};
export const LEASE_MS = 30_000;
export function maintain(meta: RoomMeta, now: number) {
  for (const seat of meta.seats)
    if (now - seat.seen >= LEASE_MS) seat.online = false;
  const eligible = (s: Seat) =>
    s.online &&
    (!meta.started || s.active) &&
    (!meta.started ||
      meta.transport === 2 ||
      (s.seq === meta.seq && (!meta.hash || s.hash === meta.hash)));
  const leader = meta.seats.find((s) => s.id === meta.leader);
  if (leader && eligible(leader) && (!meta.started || meta.leaseUntil > now))
    return false;
  const next =
    meta.seats.filter(eligible).sort((a, b) => a.color - b.color)[0]?.id ??
    null;
  if (!meta.leader && !next) return false;
  meta.leader = next;
  meta.term++;
  meta.leaseUntil = meta.leader ? now + LEASE_MS : 0;
  meta.revision++;
  return true;
}
export function commitTurn(
  meta: RoomMeta,
  peer: string,
  packet: { term: number; seq: number; previous: string; hash: string },
  now: number,
) {
  if (
    meta.leader !== peer ||
    packet.term !== meta.term ||
    now >= meta.leaseUntil
  )
    throw Error("Host lease changed");
  if (
    !meta.started ||
    packet.seq !== meta.seq + 1 ||
    (meta.hash && packet.previous !== meta.hash) ||
    !/^[a-f0-9]{64}$/.test(packet.hash)
  )
    throw Error("Commit does not extend this room");
  meta.seq = packet.seq;
  meta.hash = packet.hash;
  // The host already prepared this state; do not elect a new leader while its commit echo is in flight.
  const host = meta.seats.find((s) => s.id === peer);
  if (host) {
    host.seq = packet.seq;
    host.hash = packet.hash;
  }
  meta.deadline = now + meta.settings.timer_length * 1000;
  meta.revision++;
  meta.updated = now;
}
