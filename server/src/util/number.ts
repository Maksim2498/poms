export function isUInt(num: number): boolean {
    return Number.isInteger(num)
        && num >= 0
}