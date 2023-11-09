import { PlayerInfo } from './Utils';

export class Player {
    private id: string;
    private name: string;
    private color: number;
    private online: boolean;

    public constructor(playerInfo: PlayerInfo) {
        this.id = playerInfo.id;
        this.name = playerInfo.name;
        this.color = playerInfo.color
        this.online = true;
    }

    public getOnline() {
        return this.online;
    }

    public setOnline(online: boolean) {
        this.online = online;
    }
}