import { Container } from "pixi.js";
import { Piece } from "./Piece";
import { DirectionEnum, GameConfig, Grid, PieceMove, Position, TileEnum } from "./Utils";
import { Game } from "./Game";
import { Card } from "./Card";

// class for handling movement and other game logic
export class LogicHandler {
    public game: Game;

    public constructor(game: Game) {
        this.game = game;
    }

    public playCard(card: Card) {
        let dir = -1;
        switch (card.dir) {
            case DirectionEnum.RIGHT: { dir = 0; break; }
            case DirectionEnum.UP: { dir = 1; break; }
            case DirectionEnum.LEFT: { dir = 2; break; }
            case DirectionEnum.DOWN: { dir = 3; break; }
        }
        let dx = [1, 0, -1, 0];
        let dy = [0, -1, 0, 1];
        let normal_moves: PieceMove[] = [];
        this.game.board.pieces.forEach((piece) => {
            let cur: Position = { row: piece.row, column: piece.column };
            let dest: Position = { row: piece.row + dy[dir], column: piece.column + dx[dir] };
            // Collision check with board obstacle tiles - TODO move to LogicHandler
            if (this.game.board.getTileAtPosition(dest) == TileEnum.Impassible) {
                dest = cur;
            }

            // Collision check with other pieces
            else if (this.game.board.getPieceByPosition(dest) != null) {
                // Right now we just iteratively check every tile in the direction the piece is moving
                // until we either find an empty space or we find that it is blocked.
                let canMove: boolean = true;
                let check: Position = dest;
                while (this.game.board.getPieceByPosition(check) != null) {
                    check = { row: check.row + dy[dir], column: check.column + dx[dir] };
                    if (this.game.board.getTileAtPosition(check) == TileEnum.Impassible) {
                        canMove = false;
                        break;
                    }
                }

                if (!canMove) {
                    dest = cur;
                }
            }


            normal_moves.push({ from: cur, to: dest });
        });
        this.game.board.updateGame({
            normal_moves,
            kill_moves: [],
            score_moves: [],
        });
    }
}