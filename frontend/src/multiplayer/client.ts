import type {
    Command,
    Reply,
    Snapshot,
    Move,
    GameView,
    Checkpoint,
    CardPreview,
} from '../protocol';
import type { RoomMeta } from '../../../hosting/protocol';
import { Engine, type EngineResult } from './engine';
import { Mesh } from './mesh';
type Session = { room: string; token: string };
type Packet = {
    type: string;
    seq?: number;
    term?: number;
    hash?: string;
    previous?: string;
    action?: Move;
    checkpoint?: Checkpoint;
    id?: string;
    error?: string;
    deadline?: number;
};
export class PeerClient {
    private session: Session | null = null;
    private peer = '';
    private meta: RoomMeta | null = null;
    private engine: Engine | null = null;
    private mesh: Mesh | null = null;
    private ws: WebSocket | null = null;
    private game: GameView | null = null;
    private frames: GameView[] = [];
    private hash = '';
    private seq = 0;
    private serial: Promise<unknown> = Promise.resolve();
    private heartbeatTimer = 0;
    private tickTimer = 0;
    private reconnectTimer = 0;
    private proposal: {
        seq: number;
        term: number;
        previous: string;
        hash: string;
        action: Move;
        acks: Set<string>;
        members: string[];
    } | null = null;
    private waiting = new Map<
        string,
        {
            seq: number;
            resolve: () => void;
            reject: (e: Error) => void;
            timer: ReturnType<typeof setTimeout>;
        }
    >();
    private aiBusy = false;
    private error = '';
    private clockOffset = 0;
    private lastRoomMessage = 0;
    private visibilityChanged = () => {
        if (
            document.visibilityState === 'visible' &&
            this.lastRoomMessage &&
            Date.now() - this.lastRoomMessage > 30_000
        ) {
            const stale = this.ws;
            this.ws = null;
            stale?.close();
            this.lastRoomMessage = Date.now();
            this.connectSocket();
        } else this.beat();
    };
    private syncing = false;
    private controlRevision = -1;
    private viewRevision = 0;
    private peerHeads = new Map<string, { seq: number; hash: string }>();
    private needsPeerCheckpoint = false;
    private get revision() {
        return this.meta?.transport === 2 ? this.viewRevision : this.meta?.revision ?? 0;
    }
    private peerReady() {
        const m = this.meta;
        return (
            !!m &&
            !!this.game &&
            !this.needsPeerCheckpoint &&
            m.seats
                .filter((s) => s.online && s.id !== this.peer)
                .every(
                    (s) =>
                        this.mesh?.has(s.id) &&
                        this.peerHeads.get(s.id)?.seq === this.seq &&
                        this.peerHeads.get(s.id)?.hash === this.hash,
                )
        );
    }
    private broadcastHead() {
        if (this.meta?.transport !== 2 || !this.game) return;
        for (const seat of this.meta.seats)
            if (seat.id !== this.peer && this.mesh?.has(seat.id))
                void this.mesh
                    .send(seat.id, {
                        type: 'peer-head',
                        term: this.meta.term,
                        seq: this.seq,
                        hash: this.hash,
                    })
                    .catch(() => {});
    }
    private finishWaiters() {
        for (const [id, w] of this.waiting)
            if (this.seq > w.seq) {
                clearTimeout(w.timer);
                w.resolve();
                this.waiting.delete(id);
            }
    }
    private publishPeerResult(result: EngineResult, seq: number, deadline?: number) {
        this.setResult(result, seq);
        this.meta!.seq = seq;
        this.meta!.hash = result.hash;
        const now = Date.now() + this.clockOffset;
        this.meta!.deadline = Math.min(
            deadline ?? now + this.meta!.settings.timer_length * 1000,
            now + this.meta!.settings.timer_length * 1000,
        );
        this.viewRevision++;
        this.finishWaiters();
    }
    private enqueue(job: () => Promise<unknown>) {
        this.serial = this.serial.then(job).catch((e) => {
            this.error = e instanceof Error ? e.message : String(e);
        });
        return this.serial;
    }
    private sendRoom(packet: unknown) {
        if (this.ws?.readyState !== WebSocket.OPEN) throw Error('Reconnecting to the room…');
        this.ws.send(JSON.stringify(packet));
    }
    private async http(command: Command) {
        const response = await fetch('/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...command,
                transport: 2,
            }),
        });
        const result = await response.json();
        if (!response.ok || result.error) throw Error(result.error ?? 'Room service unavailable');
        return result as { meta: RoomMeta; peer: string; token?: string };
    }
    ready() {
        return (
            !!this.meta?.leader &&
            !!this.game &&
            (this.meta.transport !== 2 || this.peerReady()) &&
            this.seq === this.meta.seq &&
            this.meta.seats
                .filter((s) => s.online && s.id !== this.peer)
                .every((s) => this.mesh?.has(s.id))
        );
    }
    private snapshot(): Snapshot | null {
        const m = this.meta;
        if (!m) return null;
        const me = m.seats.find((s) => s.id === this.peer);
        return {
            version: 1,
            room: m.room,
            revision: this.revision,
            players: m.seats.map((s) => ({ name: s.name, color: s.color, connected: s.online })),
            settings: m.settings,
            game: this.game,
            frames: this.frames,
            you: me?.color ?? 0,
            host: m.leader === this.peer,
            solo: m.solo,
            turn_deadline_ms: m.deadline - this.clockOffset,
        };
    }
    async request(command: Command): Promise<Reply> {
        try {
            if (command.type === 'create' || command.type === 'join' || command.type === 'rejoin') {
                const r = await this.http(command);
                await this.attach(
                    {
                        room: r.meta.room,
                        token: r.token ?? ('token' in command ? command.token : null) ?? '',
                    },
                    r.peer,
                    r.meta,
                );
                return { snapshot: this.snapshot(), token: r.token ?? null, error: null };
            }
            if (!this.session || this.session.room !== command.room) {
                const r = await this.http({
                    type: 'join',
                    room: command.room,
                    name: 'Reconnecting',
                    token: command.token,
                });
                await this.attach({ room: command.room, token: command.token }, r.peer, r.meta);
            }
            await this.serial;
            if (command.type === 'get') {
                if (this.error) {
                    const e = this.error;
                    this.error = '';
                    throw Error(e);
                }
                return { snapshot: this.snapshot(), token: null, error: null };
            }
            if (command.type === 'move') {
                if (
                    !this.meta ||
                    command.revision !== this.revision ||
                    !this.game ||
                    this.seq !== this.meta.seq
                )
                    throw Error('State changed; try again');
                const me = this.meta.seats.find((s) => s.id === this.peer)!;
                if (
                    this.game.turn % 3 === 2 ||
                    (!this.meta.solo && this.game.player_id !== me.color)
                )
                    throw Error('It is not your turn');
                const id = crypto.randomUUID();
                const done = this.wait(id, this.seq);
                void done.catch(() => {});
                if (this.meta.leader === this.peer)
                    void this.enqueue(async () => {
                        try {
                            await this.propose(command.action);
                        } catch (error) {
                            this.rejectWaiting(
                                error instanceof Error ? error.message : String(error),
                            );
                        }
                    });
                else {
                    if (!this.meta.leader) throw Error('Waiting for a new host…');
                    await this.mesh!.send(this.meta.leader, {
                        type: 'move-request',
                        id,
                        seq: this.seq,
                        action: command.action,
                    });
                }
                await done;
                return { snapshot: this.snapshot(), token: null, error: null };
            }
            const r = await this.http(command);
            await this.enqueue(() => this.acceptMeta(r.meta));
            const snapshot = this.snapshot();
            if (command.type === 'leave') this.close();
            return {
                snapshot: command.type === 'leave' ? null : snapshot,
                token: null,
                error: null,
            };
        } catch (e) {
            return {
                snapshot: null,
                token: null,
                error: e instanceof Error ? e.message : String(e),
            };
        }
    }
    private wait(id: string, seq: number) {
        return new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.waiting.delete(id);
                reject(Error('The players did not finish the turn; try again'));
            }, 45_000);
            this.waiting.set(id, { seq, resolve, reject, timer });
        });
    }
    private rejectWaiting(message: string) {
        for (const w of this.waiting.values()) {
            clearTimeout(w.timer);
            if (this.seq > w.seq) w.resolve();
            else w.reject(Error(message));
        }
        this.waiting.clear();
    }
    private async attach(session: Session, peer: string, meta: RoomMeta) {
        this.close();
        this.session = session;
        this.peer = peer;
        this.engine = new Engine();
        this.meta = meta;
        if (meta.started) {
            let restored = false;
            try {
                const saved = JSON.parse(
                    sessionStorage.getItem(`udder-checkpoint-${session.room}-${peer}`) || 'null',
                );
                if (
                    saved?.checkpoint &&
                    (meta.transport === 2 || (saved.seq === meta.seq && saved.hash === meta.hash))
                ) {
                    const result = await this.engine.call({
                        type: 'restore',
                        checkpoint: saved.checkpoint,
                    });
                    if (result.hash === saved.hash) {
                        this.setResult(result, saved.seq);
                        restored = true;
                    }
                }
            } catch {
                /* A peer can supply a fresh validated checkpoint. */
            }
            if (!restored) {
                this.needsPeerCheckpoint = meta.transport === 2;
                this.setResult(
                    await this.engine.call({ type: 'init', settings: meta.settings }),
                    0,
                );
            }
        }
        const response = await fetch('/api/ice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(session),
        });
        const ice = await response.json();
        this.mesh = new Mesh(
            peer,
            ice.iceServers ?? [],
            (to, signal) => {
                try {
                    this.sendRoom({ type: 'signal', to, signal });
                } catch {}
            },
            (from, data) => void this.enqueue(() => this.receive(from, data as Packet)),
            (id) => {
                if (this.meta?.started) {
                    if (this.meta.transport === 2) {
                        void this.enqueue(async () => {
                            if (this.proposal) {
                                this.proposal = null;
                                await this.engine!.call({ type: 'discard' });
                                this.rejectWaiting('A player reconnected; please retry your move');
                            }
                            this.broadcastHead();
                            this.syncing = false;
                            this.requestSync();
                        });
                    } else if (this.seq < this.meta.seq)
                        void this.mesh?.send(id, { type: 'sync-request' });
                }
            },
        );
        document.addEventListener('visibilitychange', this.visibilityChanged);
        window.addEventListener('pageshow', this.visibilityChanged);
        window.addEventListener('focus', this.visibilityChanged);
        this.connectSocket();
        this.heartbeatTimer = window.setInterval(() => this.beat(), 8000);
        this.tickTimer = window.setInterval(() => void this.tick(), 300);
    }
    private connectSocket() {
        if (!this.session) return;
        window.clearTimeout(this.reconnectTimer);
        if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING)
            return;
        const url = new URL(`/api/rooms/${this.session.room}/socket`, location.href);
        url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('token', this.session.token);
        const ws = new WebSocket(url);
        this.ws = ws;
        ws.onopen = () => {
            if (this.ws === ws) {
                this.lastRoomMessage = Date.now();
                this.beat();
            }
        };
        ws.onmessage = (e) => {
            if (this.ws !== ws) return;
            this.lastRoomMessage = Date.now();
            const p = JSON.parse(e.data);
            if (typeof p.now === 'number') this.clockOffset = p.now - Date.now();
            if (p.type === 'meta') void this.enqueue(() => this.acceptMeta(p.meta));
            else if (p.type === 'lease' && this.meta && p.term === this.meta.term)
                this.meta.leaseUntil = p.leaseUntil;
            else if (p.type === 'signal') void this.mesh?.incoming(p.from, p.signal);
            else if (p.type === 'peer-online' && p.peer !== this.peer) this.mesh?.reset(p.peer);
            else if (p.type === 'error') {
                this.error = p.error;
                this.proposal = null;
                this.rejectWaiting(p.error);
            }
        };
        ws.onclose = (event) => {
            if (this.ws === ws && event.code === 4001) {
                this.close();
                this.error = 'Invalid session';
                return;
            }
            if (this.ws === ws && this.session)
                this.reconnectTimer = window.setTimeout(() => this.connectSocket(), 1500);
        };
    }
    private beat() {
        try {
            this.sendRoom({
                type: 'heartbeat',
                active: document.visibilityState === 'visible',
                ...(this.meta?.transport === 2 ? {} : { seq: this.seq, hash: this.hash }),
            });
        } catch {}
        this.broadcastHead();
    }
    private setResult(r: EngineResult, seq: number) {
        this.game = r.game!;
        this.frames = r.frames;
        this.hash = r.hash;
        this.seq = seq;
        if (this.session && r.checkpoint && !this.needsPeerCheckpoint)
            try {
                sessionStorage.setItem(
                    `udder-checkpoint-${this.session.room}-${this.peer}`,
                    JSON.stringify({ seq, hash: r.hash, checkpoint: r.checkpoint }),
                );
            } catch {}
    }
    private async acceptMeta(meta: RoomMeta) {
        if (meta.transport === 2) return this.acceptPeerMeta(meta);
        const old = this.meta;
        if (old && meta.revision < old.revision) return;
        if (old && meta.revision !== old.revision && meta.seq === this.seq) this.frames = [];
        this.meta = meta;
        this.mesh?.ensure(meta.seats.filter((s) => s.online).map((s) => s.id));
        if (meta.started && !this.game) {
            this.setResult(await this.engine!.call({ type: 'init', settings: meta.settings }), 0);
        }
        if (meta.seq > this.seq) {
            if (this.proposal?.seq === meta.seq && this.proposal.hash === meta.hash) {
                const r = await this.engine!.call({ type: 'commit' });
                this.setResult(r, meta.seq);
                this.proposal = null;
                this.beat();
            } else this.requestSync();
        }
        if (old && old.term !== meta.term) {
            this.proposal = null;
            await this.engine?.call({ type: 'discard' });
            if (this.seq < meta.seq) this.requestSync();
            else this.rejectWaiting('Host changed; please retry your move');
        }
        for (const [id, w] of this.waiting)
            if (this.seq > w.seq) {
                clearTimeout(w.timer);
                w.resolve();
                this.waiting.delete(id);
            }
        if (this.proposal && meta.leader === this.peer) await this.maybeCommit();
        // A metadata broadcast is not a ping. Echoing every one can create a feedback loop.
        if (!old || (!old.started && meta.started)) this.beat();
    }
    private async acceptPeerMeta(meta: RoomMeta) {
        if (meta.revision < this.controlRevision) return;
        const old = this.meta;
        const first = this.controlRevision < 0;
        const started = meta.started && (!old?.started || !this.game);
        const changedHost = !!old && old.term !== meta.term;
        const changedDuringTurn =
            !first && !!this.proposal && meta.revision !== this.controlRevision;
        // In-game presence/host updates must not enqueue the last committed frames again.
        if (meta.revision !== this.controlRevision && (!meta.started || started || first))
            this.viewRevision++;
        this.controlRevision = meta.revision;
        this.meta = {
            ...meta,
            seq: this.seq,
            hash: this.hash || null,
            deadline: old?.started ? old.deadline : meta.deadline,
        };
        this.mesh?.ensure(meta.seats.filter((s) => s.online).map((s) => s.id));
        if (started)
            this.setResult(await this.engine!.call({ type: 'init', settings: meta.settings }), 0);
        this.meta.seq = this.seq;
        this.meta.hash = this.hash || null;
        if (changedHost || changedDuringTurn) {
            this.proposal = null;
            await this.engine?.call({ type: 'discard' });
            this.rejectWaiting(
                changedHost
                    ? 'Host changed; please retry your move'
                    : 'Room changed; please retry your move',
            );
        }
        if (first || started || changedHost || changedDuringTurn) {
            this.peerHeads.clear();
            this.syncing = false;
            this.requestSync();
            this.beat();
        }
        if (this.proposal && meta.leader === this.peer) await this.maybeCommit();
    }
    private async sendCheckpoint(to: string) {
        if (!this.game || this.needsPeerCheckpoint) return;
        const result = await this.engine!.call({ type: 'view' });
        await this.mesh!.send(to, {
            type: 'peer-sync',
            term: this.meta!.term,
            seq: this.seq,
            hash: this.hash,
            checkpoint: result.checkpoint,
            deadline: this.meta!.deadline,
        });
    }
    private async receivePeerControl(from: string, p: Packet): Promise<boolean> {
        const m = this.meta!;
        if (p.type === 'sync-request') {
            await this.sendCheckpoint(from);
            return true;
        }
        if (!['peer-head', 'peer-sync', 'peer-commit'].includes(p.type)) return false;
        if (
            p.term !== m.term ||
            !Number.isSafeInteger(p.seq) ||
            p.seq! < 0 ||
            !/^[a-f0-9]{64}$/.test(p.hash ?? '')
        )
            return true;
        if (p.type === 'peer-head') {
            this.peerHeads.set(from, { seq: p.seq!, hash: p.hash! });
            if (p.seq! > this.seq) this.requestSync();
            else if (p.seq! < this.seq) await this.sendCheckpoint(from);
            else if (p.hash !== this.hash) throw Error('Players disagree on game state');
            return true;
        }
        if (p.type === 'peer-sync') {
            if (p.seq! < this.seq || !p.checkpoint) return true;
            if (p.seq === this.seq) {
                this.peerHeads.set(from, { seq: p.seq, hash: p.hash! });
                if (p.hash !== this.hash) throw Error('Players disagree on game state');
                if (this.needsPeerCheckpoint) {
                    this.needsPeerCheckpoint = false;
                    this.setResult(await this.engine!.call({ type: 'view' }), this.seq);
                }
                return true;
            }
            const previous = await this.engine!.call({ type: 'view' });
            try {
                const result = await this.engine!.call({
                    type: 'restore',
                    checkpoint: p.checkpoint,
                });
                if (result.hash !== p.hash) throw Error('Game state does not match');
                this.proposal = null;
                this.needsPeerCheckpoint = false;
                this.publishPeerResult(result, p.seq!, p.deadline);
            } catch (error) {
                await this.engine!.call({ type: 'restore', checkpoint: previous.checkpoint! });
                throw error;
            }
            this.peerHeads.set(from, { seq: p.seq!, hash: p.hash! });
            this.syncing = false;
            this.broadcastHead();
            return true;
        }
        if (from !== m.leader || p.seq !== this.seq + 1 || p.previous !== this.hash) return true;
        if (!this.proposal || this.proposal.seq !== p.seq || this.proposal.hash !== p.hash) {
            this.requestSync();
            return true;
        }
        const result = await this.engine!.call({ type: 'commit' });
        if (result.hash !== p.hash) throw Error('Game state does not match');
        this.proposal = null;
        this.publishPeerResult(result, p.seq, p.deadline);
        this.peerHeads.set(from, { seq: p.seq, hash: p.hash! });
        this.broadcastHead();
        return true;
    }
    private requestSync() {
        if (this.syncing) return;
        this.syncing = true;
        for (const s of this.meta?.seats ?? [])
            if (s.id !== this.peer && this.mesh?.has(s.id))
                void this.mesh.send(s.id, { type: 'sync-request' });
        window.setTimeout(() => {
            this.syncing = false;
        }, 1000);
    }
    private async receive(from: string, p: Packet) {
        const m = this.meta;
        if (!m || !m.seats.some((s) => s.id === from && s.online)) return;
        if (m.transport === 2 && (await this.receivePeerControl(from, p))) return;
        if (p.type === 'sync-request') {
            if (this.game && this.seq === m.seq) {
                const r = await this.engine!.call({ type: 'view' });
                await this.mesh!.send(from, {
                    type: 'sync',
                    seq: this.seq,
                    hash: this.hash,
                    checkpoint: r.checkpoint,
                });
            }
            return;
        }
        if (p.type === 'sync') {
            if (p.seq !== m.seq || !p.checkpoint || p.hash !== m.hash) return;
            const r = await this.engine!.call({ type: 'restore', checkpoint: p.checkpoint });
            if (r.hash !== m.hash) throw Error('Game state does not match');
            this.setResult(r, m.seq);
            this.syncing = false;
            this.beat();
            return;
        }
        if (p.type === 'move-request') {
            if (m.leader !== this.peer) return;
            const seat = m.seats.find((s) => s.id === from)!;
            if (
                !p.action ||
                p.seq !== this.seq ||
                (this.game?.turn ?? 2) % 3 === 2 ||
                (!m.solo && seat.color !== this.game?.player_id)
            ) {
                await this.mesh!.send(from, {
                    type: 'reject',
                    id: p.id,
                    error: 'It is not your turn',
                });
                return;
            }
            try {
                await this.propose(p.action);
            } catch (e) {
                await this.mesh!.send(from, {
                    type: 'reject',
                    id: p.id,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
            return;
        }
        if (p.type === 'reject' && from === m.leader && p.id) {
            const w = this.waiting.get(p.id);
            if (w) {
                clearTimeout(w.timer);
                w.reject(Error(p.error));
                this.waiting.delete(p.id);
            }
            return;
        }
        if (p.type === 'prepare') {
            if (
                from !== m.leader ||
                p.term !== m.term ||
                p.seq !== this.seq + 1 ||
                p.previous !== this.hash ||
                !p.action
            )
                return;
            const r = await this.engine!.call({ type: 'prepare', action: p.action });
            this.proposal = {
                seq: p.seq,
                term: p.term,
                previous: this.hash,
                hash: r.hash,
                action: p.action,
                acks: new Set([this.peer]),
                members: [],
            };
            await this.mesh!.send(from, { type: 'ack', seq: p.seq, term: p.term, hash: r.hash });
            return;
        }
        if (
            p.type === 'ack' &&
            m.leader === this.peer &&
            this.proposal &&
            p.seq === this.proposal.seq &&
            p.term === m.term &&
            p.hash === this.proposal.hash
        ) {
            this.proposal.acks.add(from);
            await this.maybeCommit();
        }
    }
    private async propose(action: Move) {
        const m = this.meta!;
        if (this.proposal) throw Error('A turn is already being committed');
        if (
            m.leader !== this.peer ||
            this.seq !== m.seq ||
            (m.transport === 2 && !this.peerReady()) ||
            Date.now() + this.clockOffset >= m.leaseUntil
        )
            throw Error('Waiting for the host lease…');
        const members = m.seats.filter((s) => s.online).map((s) => s.id);
        for (const id of members)
            if (id !== this.peer && !this.mesh?.has(id))
                throw Error('Connecting to the other players…');
        const r = await this.engine!.call({ type: 'prepare', action });
        this.proposal = {
            seq: this.seq + 1,
            term: m.term,
            previous: this.hash,
            hash: r.hash,
            action,
            acks: new Set([this.peer]),
            members,
        };
        for (const id of members)
            if (id !== this.peer)
                await this.mesh!.send(id, {
                    type: 'prepare',
                    seq: this.seq + 1,
                    term: m.term,
                    previous: this.hash,
                    action,
                });
        await this.maybeCommit();
    }
    private async maybeCommit() {
        const p = this.proposal,
            m = this.meta;
        if (!p || !m || m.leader !== this.peer || p.members.includes('__committing__')) return;
        const required = p.members.filter((id) => m.seats.some((s) => s.id === id && s.online));
        if (required.every((id) => p.acks.has(id))) {
            if (m.transport === 2) {
                p.members = ['__committing__'];
                const deadline = Date.now() + this.clockOffset + m.settings.timer_length * 1000;
                const result = await this.engine!.call({ type: 'commit' });
                if (result.hash !== p.hash) throw Error('Game state does not match');
                this.proposal = null;
                this.publishPeerResult(result, p.seq, deadline);
                for (const id of required)
                    if (id !== this.peer) {
                        this.peerHeads.set(id, { seq: p.seq, hash: p.hash });
                        try {
                            await this.mesh!.send(id, {
                                type: 'peer-commit',
                                term: p.term,
                                seq: p.seq,
                                previous: p.previous,
                                hash: p.hash,
                                deadline,
                            });
                        } catch {
                            this.peerHeads.delete(id);
                        }
                    }
                this.broadcastHead();
                return;
            }
            this.sendRoom({
                type: 'commit',
                seq: p.seq,
                term: p.term,
                previous: p.previous,
                hash: p.hash,
            });
            p.members = ['__committing__'];
        }
    }
    private async tick() {
        const m = this.meta,
            g = this.game;
        if (
            !m?.started ||
            !g ||
            g.winner ||
            m.leader !== this.peer ||
            this.seq !== m.seq ||
            (m.transport === 2 && !this.peerReady()) ||
            this.aiBusy ||
            this.proposal ||
            Date.now() + this.clockOffset >= m.leaseUntil
        )
            return;
        if (g.turn % 3 !== 2 && Date.now() + this.clockOffset < m.deadline) return;
        this.aiBusy = true;
        const term = m.term,
            seq = this.seq;
        try {
            let action: Move;
            if (g.turn % 3 === 2) {
                const r = await this.engine!.call({
                    type: 'query',
                    timeout_ms: m.settings.difficulty,
                    max_depth: 64,
                });
                action = r.action!;
            } else action = { type: 'play', card: 0, color: g.player_id };
            if (this.meta?.term === term && this.seq === seq)
                await this.enqueue(() => this.propose(action));
        } catch (e) {
            this.error = e instanceof Error ? e.message : String(e);
        } finally {
            this.aiBusy = false;
        }
    }
    async preview(card: number, revision: number): Promise<CardPreview | null> {
        await this.serial;
        if (
            !this.meta ||
            revision !== this.revision ||
            this.seq !== this.meta.seq ||
            !this.game ||
            this.proposal
        )
            return null;
        const r = await this.engine!.call({ type: 'preview', card });
        return { card, revision, steps: r.steps };
    }
    close() {
        document.removeEventListener('visibilitychange', this.visibilityChanged);
        window.removeEventListener('pageshow', this.visibilityChanged);
        window.removeEventListener('focus', this.visibilityChanged);
        this.session = null;
        this.ws?.close();
        this.ws = null;
        this.mesh?.close();
        this.mesh = null;
        this.engine?.close();
        this.engine = null;
        window.clearInterval(this.heartbeatTimer);
        window.clearInterval(this.tickTimer);
        window.clearTimeout(this.reconnectTimer);
        this.rejectWaiting('Room closed');
        this.meta = null;
        this.game = null;
        this.frames = [];
        this.seq = 0;
        this.hash = '';
        this.proposal = null;
        this.error = '';
        this.aiBusy = false;
        this.syncing = false;
        this.controlRevision = -1;
        this.lastRoomMessage = 0;
        this.viewRevision = 0;
        this.peerHeads.clear();
        this.needsPeerCheckpoint = false;
        this.serial = Promise.resolve();
    }
}
export const peerClient = new PeerClient();
