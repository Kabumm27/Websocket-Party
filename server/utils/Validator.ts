export class Validator {
    public static isString(input: any) {
        return (Object.prototype.toString.call(input) === '[object String]');
    }

    public static isInteger(input: any) {
        return Number.isInteger(input);
    }

    public static isBoolean(input: any) {
        return input === true || input === false;
    }

    public static hasValue(input: any) {
        return input !== null && input !== undefined;
    }

    public static isInRange(input: number, min: number, max: number) {
        return input >= min && input <= max;
    }

    public static hasLength(input: string, min: number, max: number) {
        if (input.length < min) return false;
        if (max !== 0 && input.length > max) return false;

        return true;
    }

    public static isStringOrError(input: any, errorMessage: string) {
        if (!Validator.isString(input)) throw new Error(errorMessage);
    }
}