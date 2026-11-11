import type { GameView, Move } from '../protocol';

export function UfoPurchaseButton({
    game,
    disabled,
    onBuy,
}: {
    game: GameView;
    disabled: boolean;
    onBuy: (action: Move) => void;
}) {
    const y = game.board.findIndex((row) => row.includes(7 + game.player_id));
    const x = y < 0 ? -1 : game.board[y].indexOf(7 + game.player_id);
    const blocked = y < 0 || game.pieces.some((piece) => piece.x === x && piece.y === y);
    return (
        <button
            disabled={disabled || game.cows_collected < 1 || blocked}
            onClick={() => onBuy({ type: 'buy', x, y })}
        >
            ＋ Buy UFO · 1 cow
        </button>
    );
}
