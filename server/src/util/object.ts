export function deepAssign<T, F>(to: T, from: F): T & F {
    for (const field in from) {
        const val   = from[field]
        const anyTo = to as any

        if (typeof val !== "object") {
            anyTo[field] = val
            continue
        }

        if (Array.isArray(val)) {
            anyTo[field] = [...val]
            continue
        }

        anyTo[field] = deepAssign(anyTo[field] ?? {}, val)
    }

    return to as T & F
}