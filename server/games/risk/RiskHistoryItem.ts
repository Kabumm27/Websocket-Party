﻿import { IHistoryItem } from "../base/game-log/IHistoryItem";

export class RiskHistoryItem implements IHistoryItem {

    public turn: number;
    public action: string;

    public constructor(turn: number, action: string) {
        this.turn = turn;
        this.action = action;
    }
}