import { assetUrl } from '../media';
import { useId, type CSSProperties } from 'react';
import type { StepEvent } from '../protocol';
import { COLORS } from '../presentation';
import { depositSpriteCount, stepDuration, stepEventKey } from './stepTiming';

export function StepEffects({ events, layer }: { events: StepEvent[]; layer: 'behind' | 'front' }) {
    const id = useId().replace(/:/g, '');
    return (
        <g className="step-effects" aria-hidden="true">
            <defs>
                <linearGradient id={`abduction-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#efffff" stopOpacity=".9" />
                    <stop offset="1" stopColor="#a9f4df" stopOpacity=".12" />
                </linearGradient>
            </defs>
            {events.map((event, i) => {
                if (event.type === 'cow_deposited' && layer === 'behind')
                    return (
                        <g
                            key={stepEventKey(event, i)}
                            data-step-effect="deposit"
                            data-deposited-cows={event.count}
                            transform={`translate(${event.x * 40 + 20},${event.y * 40 + 22})`}
                            style={
                                {
                                    '--deposit-duration': `${stepDuration([event])}ms`,
                                } as CSSProperties
                            }
                        >
                            <g className="deposit-glow">
                                <ellipse
                                    rx="18"
                                    ry="13"
                                    fill="none"
                                    stroke="#dbfff0"
                                    strokeWidth="2"
                                />
                                <path
                                    d="M0,-19L-12,1Q0,8 12,1Z"
                                    fill={`url(#abduction-${id})`}
                                    opacity=".45"
                                />
                            </g>
                            {Array.from({ length: depositSpriteCount(event.count) }, (_, cow) => (
                                <g
                                    key={cow}
                                    className="depositing-cow"
                                    style={{ '--deposit-delay': `${cow * 0.1}s` } as CSSProperties}
                                >
                                    <image
                                        href={assetUrl('/images/cow.png')}
                                        x="-15"
                                        y="-15"
                                        width="30"
                                        height="30"
                                    />
                                </g>
                            ))}
                        </g>
                    );
                if (event.type === 'cow_abducted' && layer === 'behind')
                    return (
                        <g
                            key={stepEventKey(event, i)}
                            data-step-effect="abduction"
                            data-step-target={`${event.x},${event.y}`}
                            transform={`translate(${event.x * 40},${event.y * 40})`}
                        >
                            <g className="abduct-beam">
                                <path d="M20,8L4,39Q20,45 36,39Z" fill={`url(#abduction-${id})`} />
                                <path
                                    d="M20,8L8,38M20,8L32,38"
                                    stroke="#d5fff0"
                                    strokeWidth=".8"
                                    opacity=".75"
                                />
                                <ellipse
                                    cx="20"
                                    cy="38"
                                    rx="15"
                                    ry="5"
                                    fill="none"
                                    stroke="#d2ffea"
                                    strokeWidth="1.5"
                                />
                            </g>
                            <image
                                className="abducted-cow"
                                href={assetUrl('/images/cow.png')}
                                x="0"
                                y="6"
                                width="40"
                                height="40"
                            />
                        </g>
                    );
                if (event.type === 'ufo_popped' && layer === 'front')
                    return (
                        <g
                            key={stepEventKey(event, i)}
                            data-step-effect="pitchfork-pop"
                            transform={`translate(${event.x * 40},${event.y * 40})`}
                        >
                            <image
                                className="popped-ufo"
                                href={assetUrl(
                                    `/images/player_${COLORS[event.kind - 1].toLowerCase()}.png`,
                                )}
                                x="0"
                                y="-7"
                                width="40"
                                height="40"
                            />
                            <g className="pitchfork-jab">
                                <g transform="translate(25,11) rotate(35)">
                                    <path
                                        d="M0,2V27"
                                        stroke="#9a632f"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M-5,-8V-3Q-5,2 0,2Q5,2 5,-3V-8M0,-9V2"
                                        fill="none"
                                        stroke="#e5e5cb"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />
                                </g>
                            </g>
                            <g transform="translate(20,10)">
                                <g className="capture-pop-burst">
                                    <path
                                        d="M0,-15L3,-6L12,-11L7,-2L17,1L7,5L10,14L2,8L-3,17L-5,7L-15,10L-9,2L-17,-3L-7,-5L-10,-14L-2,-8Z"
                                        fill="#fff3b0"
                                        stroke="#ffd36c"
                                        strokeWidth="1.2"
                                    />
                                    <circle r="4" fill="#fff" />
                                </g>
                            </g>
                        </g>
                    );
                return null;
            })}
        </g>
    );
}
