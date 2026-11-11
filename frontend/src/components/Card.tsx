import { ARROWS } from '../presentation';
export function Card({ dirs, activeStep }: { dirs: number[]; activeStep?: number }) {
    return (
        <span className="arrows">
            {dirs.map((d, i) => (
                <span
                    key={i}
                    className={`card-step ${activeStep === i ? 'active-arrow' : ''}`}
                    aria-current={activeStep === i ? 'step' : undefined}
                >
                    <span className="step-number" aria-hidden="true">{i + 1}</span>
                    <span className="step-arrow">{ARROWS[d]}</span>
                </span>
            ))}
        </span>
    );
}
