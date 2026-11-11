import type { StepEvent } from '../protocol';

export function depositSpriteCount(count: number): number {
    return Math.min(16, Math.max(0, Math.floor(count)));
}

export function stepDuration(events: StepEvent[] = []): number {
    return events.reduce((duration, event) => {
        if (event.type === 'cow_deposited')
            return Math.max(
                duration,
                1600 + Math.max(0, depositSpriteCount(event.count) - 1) * 100,
            );
        if (event.type === 'cow_abducted') return Math.max(duration, 1500);
        if (event.type === 'ufo_popped') return Math.max(duration, 1300);
        return duration;
    }, 500);
}

export function stepEventKey(event: StepEvent, index: number): string {
    return `${event.type}:${event.kind}:${event.x}:${event.y}:${index}`;
}
