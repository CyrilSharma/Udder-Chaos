import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Board } from '../components/Board';
import { fixtures } from './animation-fixtures';
import mapsText from '../../../assets/maps.txt?raw';
import '../style.css';

const maps = mapsText
    .trim()
    .split(/\n\s*\n/)
    .map((map) =>
        map
            .trim()
            .split('\n')
            .map((row) => row.trim().split(/\s+/).map(Number)),
    );
const joining = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 2, 2, 2, 0],
    [0, 1, 0, 1, 0, 0, 2, 0, 2, 0],
    [0, 1, 1, 1, 0, 0, 2, 2, 2, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 1, 0, 2, 0, 0, 2],
    [1, 1, 0, 1, 0, 0, 0, 2, 2, 2],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
function TerrainPreview() {
    const [map, setMap] = useState(Number(new URLSearchParams(location.search).get('map')) || 0);
    const [pieces, setPieces] = useState(true);
    const game = {
        ...fixtures.sacrifice.initial,
        board: maps[map] ?? joining,
        respawns: [],
        pieces: pieces && map === 0 ? fixtures.sacrifice.initial.pieces : [],
    };
    return (
        <div className="app">
            <div className="preview-controls">
                <label>
                    Field
                    <select value={map} onChange={(e) => setMap(Number(e.target.value))}>
                        <option value="0">Original field</option>
                        <option value="1">Central bases</option>
                        <option value="2">Corner bases</option>
                        <option value="3">Joining and holes</option>
                    </select>
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={pieces}
                        onChange={(e) => setPieces(e.target.checked)}
                    />{' '}
                    Show ships and farmers
                </label>
            </div>
            <main style={{ width: 'min(90vw,720px)', margin: '24px auto' }}>
                <Board game={game} />
            </main>
        </div>
    );
}
createRoot(document.getElementById('root')!).render(<TerrainPreview />);
