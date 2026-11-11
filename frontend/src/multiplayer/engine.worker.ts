import type { EngineRequest, EngineReply } from '../protocol';
type Exports = {
    memory: WebAssembly.Memory;
    udder_alloc(n: number): number;
    udder_free(ptr: number, len: number): void;
    udder_call(ptr: number, len: number): bigint;
};
const encoder = new TextEncoder(),
    decoder = new TextDecoder();
let engine: Promise<Exports>;
async function load() {
    const imports = { udder: { now: () => performance.now() } };
    const force = new URL(location.href).searchParams.get('scalar') === '1';
    if (!force) {
        const bytes = await fetch('/engine/simd.wasm', { cache: 'no-cache' }).then((r) =>
            r.arrayBuffer(),
        );
        if (WebAssembly.validate(bytes))
            return (await WebAssembly.instantiate(bytes, imports)).instance.exports as Exports;
    }
    return (
        await WebAssembly.instantiate(
            await fetch('/engine/scalar.wasm', { cache: 'no-cache' }).then((r) => r.arrayBuffer()),
            imports,
        )
    ).instance.exports as Exports;
}
self.onmessage = async (event: MessageEvent<{ id: number; request: EngineRequest }>) => {
    const { id, request } = event.data;
    try {
        const wasm = await (engine ??= load()),
            bytes = encoder.encode(JSON.stringify(request)),
            ptr = wasm.udder_alloc(bytes.length);
        new Uint8Array(wasm.memory.buffer, ptr, bytes.length).set(bytes);
        let packed: bigint;
        try {
            packed = wasm.udder_call(ptr, bytes.length);
        } finally {
            wasm.udder_free(ptr, bytes.length);
        }
        const address = Number(packed >> 32n),
            len = Number(packed & 0xffffffffn);
        let reply: EngineReply;
        try {
            reply = JSON.parse(decoder.decode(new Uint8Array(wasm.memory.buffer, address, len)));
        } finally {
            wasm.udder_free(address, len);
        }
        if (reply.error) throw Error(reply.error);
        const hash = reply.state
            ? Array.from(
                  new Uint8Array(
                      await crypto.subtle.digest('SHA-256', encoder.encode(reply.state)),
                  ),
              )
                  .map((b) => b.toString(16).padStart(2, '0'))
                  .join('')
            : '';
        self.postMessage({ id, result: { ...reply, state: undefined, hash } });
    } catch (error) {
        self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
    }
};
