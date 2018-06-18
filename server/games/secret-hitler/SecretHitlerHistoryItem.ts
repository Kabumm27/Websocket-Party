import { IHistoryItem } from "../base/game-log/IHistoryItem";

export class SecretHitlerHistoryItem implements IHistoryItem {

    public timestamp: number;
    public action: string;

    public constructor(action: string) {
        this.timestamp = Date.now();
        this.action = action;
    }
}