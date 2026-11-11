import { useEffect, useRef, useState } from 'react';
import type { CardPreview } from '../protocol';
import { peerClient } from '../multiplayer/client';

export function useCardPreview(
    session: { room: string; token: string } | null,
    revision: number | undefined,
    card: number | null,
    enabled: boolean,
) {
    const [preview, setPreview] = useState<CardPreview | null>(null);
    const cache = useRef(new Map<number, CardPreview>());
    useEffect(() => {
        cache.current.clear();
        setPreview(null);
    }, [session?.room, session?.token, revision]);
    useEffect(() => {
        setPreview(null);
        if (!session || revision === undefined || card === null || !enabled) return;
        const cached = cache.current.get(card);
        if (cached) {
            setPreview(cached);
            return;
        }
        let cancelled = false;
        void peerClient
            .preview(card, revision)
            .then((result) => {
                if (!cancelled && result) {
                    cache.current.set(card, result);
                    setPreview(result);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [session?.room, session?.token, revision, card, enabled]);
    return enabled && preview && preview.revision === revision && preview.card === card
        ? preview
        : null;
}
