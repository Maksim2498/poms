export function dateMillisecondsAhead(milliseconds: number): Date {
    const date            = new Date()
    const oldMilliseconds = date.getMilliseconds()
    const newMilliseconds = oldMilliseconds + milliseconds

    date.setMilliseconds(newMilliseconds)

    return date
}