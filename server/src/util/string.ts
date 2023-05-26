export function hasWs(str: string): boolean {
    return str.match(/\s/) != null
}

export function collapseWs(str: string): string {
    return str.trim()
              .replaceAll(/\s+/, " ")
}

export function isHex(str: string): boolean {
    return str.match(/^[0-9A-Fa-f]$/i) != null
}