export function isHex(string: string): boolean {
    return string.match(/^[0-9a-fA-F]*$/) != null
}