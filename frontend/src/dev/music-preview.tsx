import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Board } from '../components/Board';
import { useMusic } from '../components/useMusic';
import { fixtures } from './animation-fixtures';
import '../style.css';

function MusicPreview() {
    const root = useRef<HTMLDivElement>(null);
    const [track, setTrack] = useState('game');
    const [time, setTime] = useState(0);
    const { play, pause, seek, audio } = useMusic(track, 0, root, false);
    return (
        <div className="app" ref={root}>
            <div className="preview-controls">
                <label>
                    Track
                    <select value={track} onChange={(e) => setTrack(e.target.value)}>
                        <option value="game">Game</option>
                        <option value="menu">Menu</option>
                        <option value="lobby">Lobby</option>
                    </select>
                </label>
                <button onClick={play}>Play muted preview</button>
                <button onClick={pause}>Pause music</button>
                <button onClick={() => audio.current?.pause()}>Simulate interruption</button>
                <button onClick={() => window.dispatchEvent(new Event('pageshow'))}>Simulate app return</button>
                <label>
                    Seek to seconds
                    <input
                        type="number"
                        min="0"
                        value={time}
                        onChange={(e) => setTime(Number(e.target.value))}
                    />
                </label>
                <button onClick={() => seek(time)}>Seek</button>
                <span>Audio output: muted</span>
                <span className="music-beat-indicator" aria-label="Music beat indicator" />
            </div>
            <main style={{ width: 'min(90vw, 650px)', margin: '24px auto' }}>
                <Board game={fixtures.sacrifice.initial} />
            </main>
        </div>
    );
}
createRoot(document.getElementById('root')!).render(<MusicPreview />);
