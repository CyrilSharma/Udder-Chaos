import { Container } from "pixi.js";
import { Piece } from "./Piece";
import { DirectionEnum, GameConfig, Grid, PieceAction, Position, TileEnum, dx, dy, getTeam, TeamEnum, canMoveOver, ActionType } from "./Utils";
import { Game } from "./Game";
import { Card } from "./Card";

// class for handling movement and other game logic
export class LogicHandler {
    public game: Game;

    public constructor(game: Game) {
        this.game = game;
    }

    /** Play a card associated with a given color */
    public playCard(card: Card, color: number) {
        // Figure out what the card does
        let dir = -1;
        switch (card.dir) {
            case DirectionEnum.RIGHT: { dir = 0; break; }
            case DirectionEnum.UP:    { dir = 1; break; }
            case DirectionEnum.LEFT:  { dir = 2; break; }
            case DirectionEnum.DOWN:  { dir = 3; break; }
        }

        // Action update lists
        let pre_actions: PieceAction[] = [];
        let moves: PieceAction[] = [];
        let post_actions: PieceAction[] = [];

        // For each piece, move it if needed
        this.game.board.pieces.forEach((piece) => {
            if (piece.type == color) {
                this.movePiece(piece, dir, pre_actions, moves, post_actions);
            }
        });

        // Send updates to game board
        this.game.board.updateGame([pre_actions, moves, post_actions]);
    }

    /** Function for piece movement logic */
    public movePiece(piece: Piece, dir: number, pre_actions: PieceAction[], moves: PieceAction[], post_actions: PieceAction[]) {
        // Current position
        let cur: Position = { row: piece.row, column: piece.column };
        // Destination position
        let dest: Position = { row: piece.row + dy[dir], column: piece.column + dx[dir] };

        console.log(`Moving ${[cur.row, cur.column]}`);

        // Collision check with board obstacle tiles
        if (this.game.board.getTileAtPosition(dest) == TileEnum.Impassible) {
            moves.push({ action: ActionType.Obstruction_Move, piece: piece, move: dest });
            return;
        }

        // Collision check with other pieces, if piece can invade another piece, skip
        else if (this.game.board.getPieceByPosition(dest) != null && !canMoveOver(piece.type, this.game.board.getPieceByPosition(dest)!.type)) {
            // iteratively check every tile in the direction the piece is moving
            // until we find a piece that is not moving or an obstacle
            let canMove: boolean = canMoveOver(piece.type, this.game.board.getPieceByPosition(dest)!.type);
            let check: Position = cur;
            
            do { 
                // Get next check location
                check = { row: check.row + dy[dir], column: check.column + dx[dir] };

                // If we have run into a wall, can't move
                if (this.game.board.getTileAtPosition(check) == TileEnum.Impassible) {
                    canMove = false;
                    break;
                }
                // If this is a piece, we check if it is a player piece, enemy piece, or cow
                else if (this.game.board.getPieceByPosition(check) != null) {
                    let collidePiece: Piece | null = this.game.board.getPieceByPosition(check);

                    // If this is a friendly piece, we check the next square
                    if (collidePiece!.type == piece.type) {
                        continue;
                    }    
                    // If this is a cow (or for enemy pieces, if this is a player piece), we can move
                    else if (canMoveOver(piece.type, collidePiece!.type)) {
                        canMove = true;
                        break;
                    }
                    // Otherwise, we cannot move
                    else {
                        canMove = false;
                        break;
                    }
                } 
                // Nothing here, we can move
                else {
                    canMove = true;
                    break;
                }
            } while (this.game.board.getPieceByPosition(check) != null);
            
            // If we can't move, update the destination to remain in the current position
            if (!canMove) {
                moves.push({ action: ActionType.Obstruction_Move, piece: piece, move: dest });
                return;
            }
        }

        // If move places you on another piece, then update move type accordingly
        if (this.game.board.getPieceByPosition(dest) != null) {
            if (!canMoveOver(piece.type, this.game.board.getPieceByPosition(dest)!.type)) {
                if (piece.type != this.game.board.getPieceByPosition(dest)!.type) 
                    throw Error("Can't move onto this piece!!!");
            }
            else {
                switch (getTeam(piece.type)) {
                    case TeamEnum.Player: { post_actions.push({ action: ActionType.Abduct_Action, piece: piece, move: dest }); break; }
                    case TeamEnum.Enemy: { pre_actions.push({ action: ActionType.Kill_Action, piece: piece, move: dest }); break; }
                    default: { throw Error("Illegal move handling in logic handler"); break; }
                }
            }
        }

        // If moving onto a destination tile, add score action.
        if (this.game.board.getTileAtPosition(dest) == TileEnum.Destination) {
            post_actions.push({ action: ActionType.Score_Action, piece: piece, move: dest });
        }

        moves.push({ action: ActionType.Normal_Move, piece: piece, move: dest });
    }
}