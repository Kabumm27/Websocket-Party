export interface SettingsItem<T> {
    name: string;
    default: T;

    validate(value: T): T;
    toState(): {};
}

export type SettingsValue = string | boolean | number;