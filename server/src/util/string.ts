export function hasWs(str: string): boolean {
    return str.match(/\s/) != null
}

export function collapseWs(str: string): string {
    return str.trim()
              .replaceAll(/\s+/g, " ")
}

export function isHex(str: string): boolean {
    return str.match(/^[0-9A-Fa-f]*$/i) != null
}

export function escape(str: string): string {
    return str.replaceAll(/'/g,  "\\'")
              .replaceAll(/'/g,  '\\"')
              .replaceAll(/\n/g, "\\n")
}