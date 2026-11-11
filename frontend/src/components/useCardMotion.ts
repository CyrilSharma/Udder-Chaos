import { useLayoutEffect, useRef } from 'react';
import { CARD_TRAVEL_MS } from './cardPlayback';

type Position = { left: number; top: number; width: number; height: number };

/** Follow each Rust card ID as it moves between hands and the shared queue. */
export function useCardMotion() {
    const root = useRef<HTMLDivElement>(null);
    const previous = useRef(new Map<string, Position>());
    useLayoutEffect(() => {
        const next = new Map<string, Position>();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        root.current?.querySelectorAll<HTMLElement>('[data-card-id]').forEach((element) => {
            // Layout coordinates exclude an in-progress animation's visual transform.
            const current = {
                left: 0,
                top: 0,
                width: element.offsetWidth,
                height: element.offsetHeight,
            };
            let parent: HTMLElement | null = element;
            while (parent) {
                current.left += parent.offsetLeft;
                current.top += parent.offsetTop;
                parent = parent.offsetParent as HTMLElement | null;
            }
            const id = element.dataset.cardId!;
            const old = previous.current.get(id);
            next.set(id, current);
            if (!reduced && old && (old.left !== current.left || old.top !== current.top)) {
                element.getAnimations().forEach((animation) => animation.cancel());
                element.animate(
                    [
                        {
                            zIndex: 100,
                            transform: `translate(${old.left - current.left}px, ${
                                old.top - current.top
                            }px) scale(${old.width / current.width}, ${
                                old.height / current.height
                            })`,
                        },
                        { transform: 'translate(0, 0) scale(1, 1)', zIndex: 100 },
                    ],
                    { duration: CARD_TRAVEL_MS, easing: 'cubic-bezier(.22,.7,.2,1)' },
                );
            }
        });
        previous.current = next;
    });
    return root;
}
