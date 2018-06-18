import { SettingsItem, SettingsValue } from "./SettingsItem";
import { SettingsItemInteger } from "./SettingsItemInteger";
import { SettingsItemBoolean } from "./SettingsItemBoolean";
import { SettingsItemSelection } from "./SettingsItemSelection";

export class Settings {

    public settingsItems: SettingsItem<SettingsValue>[] = [];

    public constructor(settingsItems?: SettingsItem<SettingsValue>[]) {
        this.settingsItems = settingsItems;
    }

    public getDefaultValues() {
        var list: SettingsValue[] = [];
        for (var i = 0; i < this.settingsItems.length; i++) {
            list.push(this.settingsItems[i].default);
        }
        return list;
    }

    public toState() {
        return this.settingsItems.map((items) => items.toState());
    }
}