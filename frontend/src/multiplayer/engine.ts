import type { EngineRequest, EngineReply } from '../protocol';
export type EngineResult = Omit<EngineReply, 'state'> & { hash: string };
export class Engine {
    private worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
    private id = 0;
    private pending = new Map<
        number,
        { resolve: (r: EngineResult) => void; reject: (e: Error) => void }
    >();
    constructor() {
        this.worker.onmessage = (e) => {
            const p = this.pending.get(e.data.id);
            if (!p) return;
            this.pending.delete(e.data.id);
            if (e.data.error) p.reject(Error(e.data.error));
            else p.resolve(e.data.result);
        };
        this.worker.onerror = (e) => {
            for (const p of this.pending.values()) p.reject(Error(e.message));
            this.pending.clear();
        };
    }
    call(request: EngineRequest): Promise<EngineResult> {
        return new Promise((resolve, reject) => {
            const id = ++this.id;
            this.pending.set(id, { resolve, reject });
            this.worker.postMessage({ id, request });
        });
    }
    close() {
        this.worker.terminate();
        for (const p of this.pending.values()) p.reject(Error('Engine closed'));
        this.pending.clear();
    }
}
