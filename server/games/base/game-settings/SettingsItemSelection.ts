import { SettingsItem } from "./SettingsItem";

export class SettingsItemSelection implements SettingsItem<string> {
    
    public name: string;
    public default: string;
    public options: string[];

    public constructor(name: string, options: string[], defaultValue: string) {
        this.name = name;
        this.options = options;
        this.default = defaultValue;
    }

    public validate(value: string) {
        for (var i = 0; i < this.options.length; i++) {
            if (this.options[i] === value) {
                return value;
            }
        }
        return null;
    }

    public toState() {
        return {
            type: "selection",
            name: this.name,
            default: this.default,
            options: this.options
        }
    }
}