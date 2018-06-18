import { SettingsItem } from "./SettingsItem";

export class SettingsItemInteger implements SettingsItem<number> {
    
    public name: string;
    public min: number;
    public max: number;
    public step: number;
    public default: number;
    public suffix: string;

    public constructor(name: string, min: number, max: number, step: number, defaultValue: number, suffix: string) {
        this.name = name;
        this.min = min;
        this.max = max;
        this.step = step;
        this.default = defaultValue;
        this.suffix = suffix;
    }

    public validate(value: number) {
        if (!isNaN(value) && value >= this.min && value <= this.max) {
            return Math.round(value / this.step) * this.step;
        }
        else {
            return null;
        }
    }

    public toState() {
        return {
            type: "int",
            name: this.name,
            default: this.default,
            min: this.min,
            max: this.max,
            step: this.step,
            suffix: this.suffix
        }
    }
}