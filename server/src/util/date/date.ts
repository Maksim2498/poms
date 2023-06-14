import ReadonlyDate from "./ReadonlyDate"

export function isInvalid(date: ReadonlyDate): boolean {
    return Number.isNaN(date.valueOf())
}

export function daysAhead(days: number): Date {
    return addDays(new Date, days)
}

export function hoursAhead(hours: number): Date {
    return addHours(new Date(), hours)
}

export function minutesAhead(minutes: number): Date {
    return addMinutes(new Date(), minutes)
}

export function secondsAhead(seconds: number): Date {
    return addSeconds(new Date(), seconds)
}

export function millisecondsAhead(milliseconds: number): Date {
    return addMilliseconds(new Date(), milliseconds)
}

export function addDays(date: Date, days: number): Date {
    date.setDate(date.getDate() + days)
    return date
}

export function addHours(date: Date, hours: number): Date {
    date.setHours(date.getHours() + hours)
    return date
}

export function addMinutes(date: Date, minutes: number): Date {
    date.setMinutes(date.getMinutes() + minutes)
    return date
}

export function addSeconds(date: Date, seconds: number): Date {
    date.setSeconds(date.getSeconds() + seconds)
    return date
}

export function addMilliseconds(date: Date, milliseconds: number): Date {
    date.setMilliseconds(date.getMilliseconds() + milliseconds)
    return date
}