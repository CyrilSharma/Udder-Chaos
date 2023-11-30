import { Game } from "./Game";
import { PlayerMove, MoveType, PlayData, RotateData, Position } from "./Utils";

export class MoveQueue {
    private game: Game;
    private queueData: Array<PlayerMove>= [];

    constructor(game: Game) {
        this.game = game;
    }

    public async startQueue() {
        while (this.queueData.length > 0) {
            let playerMove = this.queueData[0];
            this.game.animating = true;
            switch (playerMove.moveType) {
                case MoveType.PlayCard: {
                    let moveData = playerMove.moveData as PlayData;
                    let card = this.game.cards.findCardInHand(moveData["index"], playerMove.color);
                    await this.game.cards.playCard(card, playerMove.color, playerMove.animated);
                    break;
                }
                case MoveType.RotateCard: {
                    let moveData = playerMove.moveData as RotateData;
                    let card = this.game.cards.findCardInHand(moveData["index"], playerMove.color);
                    await card.rotateCard(moveData["rotation"]);
                    break;
                }
                case MoveType.PurchaseUFO: {
                    await this.game.board.purchaseUFO(playerMove.moveData as Position, playerMove.color);
                    break;
                }
            }
            this.game.animating = false;
            this.game.updateTurn();
            this.dequeue();
        }
    }

    public enqueue(playerMove: PlayerMove) {
        this.queueData.push(playerMove);

        if (this.queueData.length == 1) {
            this.startQueue();
        }
    }

    public dequeue() {
        if (this.queueData.length > 0) {
            return this.queueData.shift();
        }
        return;
    }
}