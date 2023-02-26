export function dateSecondsAhead(seconds?: number) {
    if (seconds == null)
        return undefined

    const date = new Date()

    date.setSeconds(date.getSeconds() + seconds)

    return date
}