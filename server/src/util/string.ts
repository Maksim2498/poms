export function hasWs(str: string): boolean {
    return str.match(/\s/) != null
}

export function collapseWs(str: string): string {
    return str.trim()
              .replaceAll(/\s+/, " ")
}