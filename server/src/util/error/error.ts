export function getStringCode(error: unknown): string | undefined {
    return typeof error === "object"
        && error !=  null
        && "code" in error
        && typeof error.code === "string"
            ? error.code
            : undefined
}