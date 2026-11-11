import { useId } from 'react';

/** A single, ground-level crew portal for spawning and shared cow deposits. */
export function Portal({ x, y, color }: { x: number; y: number; color: string }) {
    const id = useId().replace(/:/g, '');
    return (
        <g
            data-portal-color={color}
            data-portal-cell={`${x},${y}`}
            transform={`translate(${x * 40 + 20},${y * 40 + 22})`}
        >
            <defs>
                <radialGradient id={`portal-${id}`}>
                    <stop offset="0" stopColor="#142c3b" />
                    <stop offset=".48" stopColor={color} stopOpacity=".75" />
                    <stop offset=".82" stopColor={color} />
                    <stop offset="1" stopColor="#e9fff0" />
                </radialGradient>
            </defs>
            <ellipse cy="3" rx="18" ry="12" fill="#263c44" opacity=".25" />
            <g transform="scale(1,.72)">
                <circle r="17.5" fill={`url(#portal-${id})`} stroke={color} strokeWidth="2" />
                <circle r="15" fill="none" stroke="#effff4" strokeWidth=".8" opacity=".6" />
                <g className="portal-vortex">
                    <circle r="16" fill="none" />
                    {[0, 120, 240].map((angle) => (
                        <path
                            key={angle}
                            transform={`rotate(${angle})`}
                            d="M0,0C-6,-4 -12,1 -10,7C-7,15 5,16 12,8"
                            fill="none"
                            stroke="#e6fff4"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            opacity=".8"
                        />
                    ))}
                </g>
                <circle r="3" fill="#18383d" />
            </g>
        </g>
    );
}
