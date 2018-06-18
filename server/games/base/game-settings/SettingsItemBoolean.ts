import { SettingsItem } from "./SettingsItem";

export class SettingsItemBoolean implements SettingsItem<boolean> {
    
    public name: string;
    public default: boolean;

    public constructor(name: string, defaultValue: boolean) {
        this.name = name;
        this.default = defaultValue;
    }

    public validate(value: boolean) {
        if (typeof value === "boolean") {
            return value;
        }
        else {
            return null;
        }
    }

    public toState() {
        return {
            type: "boolean",
            name: this.name,
            default: this.default
        }
    }
}