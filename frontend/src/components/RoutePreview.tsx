import { useId } from 'react';
import type { CardPreview } from '../protocol';

export function RoutePreview({
    preview,
    width,
    height,
}: {
    preview: CardPreview;
    width: number;
    height: number;
}) {
    const id = useId().replace(/:/g, '');
    const tiles = new Map(
        preview.steps.flatMap((step) => step.map((p) => [`${p.x}:${p.y}`, p] as const)),
    );
    return (
        <g className="route-preview" aria-hidden="true" clipPath={`url(#route-clip-${id})`}>
            <defs>
                <clipPath id={`route-clip-${id}`}>
                    <rect width={width} height={height} />
                </clipPath>
            </defs>
            {Array.from(tiles.values()).map((p) => (
                <g key={`${p.x}:${p.y}`} data-preview-tile={`${p.x},${p.y}`}>
                    <rect
                        className="route-light"
                        x={p.x * 40 + 3}
                        y={p.y * 40 + 3}
                        width="34"
                        height="34"
                        rx="8"
                    />
                    <rect
                        className="route-light-core"
                        x={p.x * 40 + 6}
                        y={p.y * 40 + 6}
                        width="28"
                        height="28"
                        rx="6"
                    />
                </g>
            ))}
        </g>
    );
}
