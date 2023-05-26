export function millisecondsAhead(milliseconds: number): Date {
    return addMilliseconds(new Date(), milliseconds)
}

export function addMilliseconds(date: Date, milliseconds: number): Date {
    date.setMilliseconds(date.getMilliseconds() + milliseconds)
    return date
}