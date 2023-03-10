export function dateMillisAhead(millis?: number) {
    if (millis == null)
        return undefined

    const date = new Date()

    date.setMilliseconds(date.getMilliseconds() + millis)

    return date
}