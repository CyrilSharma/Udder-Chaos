// Only SDP/ICE pass through the room service. Game packets use ordered WebRTC channels.
export class Mesh {
    private peers = new Map<
        string,
        { pc: RTCPeerConnection; channel?: RTCDataChannel; ice: RTCIceCandidateInit[] }
    >();
    private fragments = new Map<string, { parts: string[]; count: number; size: number }>();
    constructor(
        private self: string,
        private iceServers: RTCIceServer[],
        private signal: (to: string, signal: unknown) => void,
        private receive: (from: string, data: unknown) => void,
        private opened: (peer: string) => void,
    ) {}
    has(id: string) {
        return this.peers.get(id)?.channel?.readyState === 'open';
    }
    ensure(ids: string[]) {
        for (const id of [...this.peers.keys()])
            if (!ids.includes(id)) {
                this.peers.get(id)!.pc.close();
                this.peers.delete(id);
            }
        for (const id of ids) if (id !== this.self && !this.peers.has(id)) this.connect(id);
    }
    reset(id: string) {
        this.peers.get(id)?.pc.close();
        this.peers.delete(id);
        this.connect(id);
    }
    private connect(id: string) {
        if (id === this.self) return;
        const pc = new RTCPeerConnection({ iceServers: this.iceServers }),
            entry = {
                pc,
                ice: [] as RTCIceCandidateInit[],
                channel: undefined as RTCDataChannel | undefined,
            };
        this.peers.set(id, entry);
        pc.onicecandidate = (e) => {
            if (e.candidate) this.signal(id, { candidate: e.candidate.toJSON() });
        };
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed') {
                pc.close();
                this.peers.delete(id);
                setTimeout(() => {
                    if (!this.peers.has(id)) this.connect(id);
                }, 1000);
            }
        };
        const attach = (channel: RTCDataChannel) => {
            entry.channel = channel;
            channel.bufferedAmountLowThreshold = 128 * 1024;
            channel.onopen = () => this.opened(id);
            channel.onmessage = (e) => {
                try {
                    if (typeof e.data !== 'string' || e.data.length > 32_000) return;
                    const packet = JSON.parse(e.data);
                    if (packet.chunk) {
                        const key = `${id}:${packet.chunk}`;
                        let f = this.fragments.get(key);
                        if (!f) {
                            if (
                                this.fragments.size > 16 ||
                                !Number.isInteger(packet.total) ||
                                packet.total < 1 ||
                                packet.total > 512
                            )
                                return;
                            f = { parts: [], count: packet.total, size: 0 };
                            this.fragments.set(key, f);
                            setTimeout(() => this.fragments.delete(key), 15_000);
                        }
                        if (
                            !Number.isInteger(packet.index) ||
                            packet.index < 0 ||
                            packet.index >= f.count ||
                            typeof packet.data !== 'string'
                        )
                            return;
                        if (f.parts[packet.index] === undefined) {
                            f.parts[packet.index] = packet.data;
                            f.size += packet.data.length;
                            if (f.size > 4_000_000) {
                                this.fragments.delete(key);
                                return;
                            }
                        }
                        if (f.parts.filter((p) => p !== undefined).length === f.count) {
                            this.fragments.delete(key);
                            this.receive(id, JSON.parse(f.parts.join('')));
                        }
                    } else this.receive(id, packet);
                } catch {
                    /* Invalid peer packet is ignored. */
                }
            };
        };
        pc.ondatachannel = (e) => attach(e.channel);
        if (this.self < id) {
            attach(pc.createDataChannel('udder', { ordered: true }));
            void pc
                .createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => this.signal(id, { description: pc.localDescription }))
                .catch(() => {});
        }
    }
    async incoming(
        id: string,
        signal: { description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit },
    ) {
        if (!this.peers.has(id)) this.connect(id);
        const entry = this.peers.get(id)!;
        try {
            if (signal.description) {
                await entry.pc.setRemoteDescription(signal.description);
                for (const c of entry.ice) await entry.pc.addIceCandidate(c);
                entry.ice = [];
                if (signal.description.type === 'offer') {
                    await entry.pc.setLocalDescription(await entry.pc.createAnswer());
                    this.signal(id, { description: entry.pc.localDescription });
                }
            } else if (signal.candidate) {
                if (entry.pc.remoteDescription) await entry.pc.addIceCandidate(signal.candidate);
                else entry.ice.push(signal.candidate);
            }
        } catch {
            /* Reconnection negotiates a fresh channel. */
        }
    }
    async send(id: string, data: unknown) {
        const channel = this.peers.get(id)?.channel;
        if (!channel || channel.readyState !== 'open') throw Error('Connecting to the crew…');
        const text = JSON.stringify(data);
        if (text.length > 4_000_000) throw Error('Peer message too large');
        const chunk = crypto.randomUUID(),
            total = Math.ceil(text.length / 10_000);
        for (let index = 0; index < total; index++) {
            if (channel.bufferedAmount > 512 * 1024)
                await new Promise<void>((resolve, reject) => {
                    const timer = setTimeout(() => reject(Error('Peer connection stalled')), 5000);
                    channel.addEventListener(
                        'bufferedamountlow',
                        () => {
                            clearTimeout(timer);
                            resolve();
                        },
                        { once: true },
                    );
                });
            channel.send(
                JSON.stringify({
                    chunk,
                    index,
                    total,
                    data: text.slice(index * 10_000, (index + 1) * 10_000),
                }),
            );
        }
    }
    close() {
        for (const { pc } of this.peers.values()) pc.close();
        this.peers.clear();
        this.fragments.clear();
    }
}
