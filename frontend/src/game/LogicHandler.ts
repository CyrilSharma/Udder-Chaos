import { Container } from "pixi.js";
import { Piece } from "./Piece";
import { DirectionEnum, GameConfig, Grid, PieceMove, Position, TileEnum, dx, dy, getTeam, TeamEnum, canMoveOver, MoveType } from "./Utils";
import { Game } from "./Game";
import { Card } from "./Card";

// class for handling movement and other game logic
export class LogicHandler {
    public game: Game;

    public constructor(game: Game) {
        this.game = game;
    }

    public playCard(card: Card, color: number) {
        let dir = -1;
        switch (card.dir) {
            case DirectionEnum.RIGHT: { dir = 0; break; }
            case DirectionEnum.UP: { dir = 1; break; }
            case DirectionEnum.LEFT: { dir = 2; break; }
            case DirectionEnum.DOWN: { dir = 3; break; }
        }

        let normal_moves: PieceMove[] = [];
        let kill_moves: PieceMove[] = [];
        let score_moves: PieceMove[] = [];
        this.game.board.pieces.forEach((piece) => {
            if (piece.type == color) {
                this.movePiece(piece, dir, normal_moves, kill_moves, score_moves);
            }
        });
        this.game.board.updateGame({
            normal_moves,
            kill_moves,
            score_moves,
        });
    }

    public movePiece(piece: Piece, dir: number, normal_moves: PieceMove[], kill_moves: PieceMove[], score_moves: PieceMove[]) {
        let cur: Position = { row: piece.row, column: piece.column };
        let dest: Position = { row: piece.row + dy[dir], column: piece.column + dx[dir] };
        let moveType: number = MoveType.Normal_Move;

        console.log(`Moving ${[cur.row, cur.column]}`);

        // Collision check with board obstacle tiles
        if (this.game.board.getTileAtPosition(dest) == TileEnum.Impassible) {
            dest = cur;
        }

        // Collision check with other pieces
        else if (this.game.board.getPieceByPosition(dest) != null && !canMoveOver(piece.type, this.game.board.getPieceByPosition(dest)!.type)) {
            console.log(`Piece collision check`);
            // iteratively check every tile in the direction the piece is moving
            // until we find a piece that is not moving or an obstacle
            let canMove: boolean = canMoveOver(piece.type, this.game.board.getPieceByPosition(dest)!.type);
            console.log(`canMove: ${canMove}`);
            let check: Position = cur;
            do {
                check = { row: check.row + dy[dir], column: check.column + dx[dir] };
                if (this.game.board.getTileAtPosition(check) == TileEnum.Impassible) {
                    canMove = false;
                    break;
                } else if (this.game.board.getPieceByPosition(check) != null) {
                    let collidePiece: Piece | null = this.game.board.getPieceByPosition(check);
                    if (collidePiece!.type == piece.type) {
                        continue;
                    }    
                    else if (canMoveOver(piece.type, collidePiece!.type)) {
                        canMove = true;
                        break;
                    }
                    else {
                        canMove = false;
                        break;
                    }
                } else {
                    canMove = true;
                    break;
                }
            } while (this.game.board.getPieceByPosition(check) != null);
            
            if (!canMove) {
                dest = cur;
            }
        }

        if (dest != cur && this.game.board.getPieceByPosition(dest) != null &&
            canMoveOver(piece.type, this.game.board.getPieceByPosition(dest)!.type)) {
            switch (getTeam(piece.type)) {
                case TeamEnum.Player: { moveType = MoveType.Score_Move; break; }
                case TeamEnum.Enemy: { moveType = MoveType.Kill_Move; break; }
                default: { moveType = MoveType.Normal_Move; throw Error("Illegal move handling in logic handler"); break; }
            }
        }

        console.log(`dest: ${[dest.row, dest.column]}`);
        console.log(`moveType: ${moveType}`);

        if (moveType == MoveType.Normal_Move) normal_moves.push({ from: cur, to: dest });
        else if (moveType == MoveType.Kill_Move) kill_moves.push({ from: cur, to: dest });
        else if (moveType == MoveType.Score_Move) score_moves.push({ from: cur, to: dest });
        else throw Error("Unknown move type: " + moveType);
    }
}