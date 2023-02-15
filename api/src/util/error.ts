import { Logger } from "winston"

export class LoggedError extends Error {
    constructor(error: any) {
        super(
            error instanceof Error ? error.message : error,
            { cause: error }
        )
    }
}

export function fromMessage(message: string, logger?: Logger): Error {
    logger?.error(message)
    return forward(new Error(message), logger)
}

export function forward(error: any, logger?: Logger): any {
    return logger ? new LoggedError(error) : error
}