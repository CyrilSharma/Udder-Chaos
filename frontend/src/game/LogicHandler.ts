import { Container } from "pixi.js";
import { Piece } from "./Piece";
import { DirectionEnum, GameConfig, Grid, PieceAction, Position, TileEnum, dx, dy, getTeam, TeamEnum, canMoveOver, checkActionType, ActionType, PieceEnum, canMoveOverAll } from "./Utils";
import { Game } from "./Game";
import { Card } from "./Card";

// class for handling movement and other game logic
export class LogicHandler {
    public game: Game;

    public constructor(game: Game) {
        this.game = game;
    }

    /** Play a card associated with a given color */
    public async playCard(card: Card, color: number, animated: boolean) {
        for (let i = 0; i < card.dirs.length; i++) {
            let move = card.dirs[i];
            // Figure out what the card does
            let dir = -1;
            switch (move) {
                case DirectionEnum.RIGHT: { dir = 0; break; }
                case DirectionEnum.UP:    { dir = 1; break; }
                case DirectionEnum.LEFT:  { dir = 2; break; }
                case DirectionEnum.DOWN:  { dir = 3; break; }
            }

            // Action update lists
            let pre_actions: PieceAction[] = [];
            let moves: PieceAction[] = [];
            let post_actions: PieceAction[] = [];

            // For each of the player's piece, move it if needed
            this.game.board.pieces.forEach((piece) => {
                if (piece.type == color) {
                    this.movePiece(piece, dir, pre_actions, moves, post_actions);
                }
            });

            // Send updates to game board
            await this.game.board.updateGame([pre_actions, moves, post_actions], animated);
        }
    }

    /** Function for piece movement logic */
    public movePiece(piece: Piece, dir: number, pre_actions: PieceAction[], moves: PieceAction[], post_actions: PieceAction[]) {
        // Current position
        let cur: Position = { row: piece.row, column: piece.column };
        // Destination position
        let dest: Position = { row: piece.row + dy[dir], column: piece.column + dx[dir] };

        // Collision check with board obstacle tiles
        if (this.game.board.getTileAtPosition(dest) == TileEnum.Impassible) {
            moves.push({ action: ActionType.Obstruction_Move, piece: piece, move: dest });
            return;
        }

        // Collision check with other pieces, if piece can invade another piece, skip
        else if (this.game.board.getPiecesByPosition(dest).length != 0 && !canMoveOverAll(piece.type, this.game.board.getPiecesByPosition(dest))) {
            // iteratively check every tile in the direction the piece is moving
            // until we find a piece that is not moving or an obstacle
            // let canMove: boolean = canMoveOverAll(piece.type, this.game.board.getPiecesByPosition(dest));
            let canMove: boolean = false;
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
                else if (this.game.board.getPiecesByPosition(check) != null) {
                    let collidePieces: Piece[] = this.game.board.getPiecesByPosition(check);
                    for (let collidePiece of collidePieces) {

                        // If this is a friendly piece, check the next square 
                        // (we can move onto this square as long as the next piece can move)
                        if (collidePiece.type == piece.type) {
                            canMove = false;
                            break;
                        }    
                        // if we can move over this piece, check the other pieces on this square and set canMove to yes
                        else if (canMoveOver(piece.type, collidePiece.type)) {
                            canMove = true;
                        }
                        // Otherwise, we cannot move
                        else {
                            canMove = false;
                            break;
                        }

                    }
                } 
                // Nothing here, we can move
                else {
                    canMove = true;
                    break;
                }
            } while (this.game.board.getPiecesByPosition(check).length != 0);
            
            // If we can't move, update the destination to remain in the current position
            if (!canMove) {
                moves.push({ action: ActionType.Obstruction_Move, piece: piece, move: dest });
                return;
            }
        }

        // If move places you on another piece, then update move type accordingly
        let destPieces = this.game.board.getPiecesByPosition(dest);
        if (destPieces.length != 0) {
            // If moving to a friendly unit, that's okay.
            // if (!canMoveOver(piece.type, destPiece!.type)) {
            //     if (piece.type != destPiece!.type) 
            //         throw Error("Can't move onto this piece!!!");
            // }
            // else {
            for (let destPiece of destPieces) {
                switch (checkActionType(piece.type, destPiece.type)) {
                    case ActionType.Abduct_Action: { post_actions.push({ action: ActionType.Abduct_Action, piece: piece, move: dest }); break; }
                    case ActionType.Kill_Action: { pre_actions.push({ action: ActionType.Kill_Action, piece: piece, move: dest }); break; }
                    default: { break; }
                }
            }
            // }
        }

        // If moving onto a destination tile, add score action.
        if (piece.score > 0 && this.game.board.colorAtMatchingDestination(dest, piece.type)) {
            post_actions.push({ action: ActionType.Score_Action, piece: piece, move: dest });
        }

        moves.push({ action: ActionType.Normal_Move, piece: piece, move: dest });
    }
}