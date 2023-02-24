import { Logger } from "winston"

export default class LoggedError extends Error {
    static fromMessage(message: string, logger?: Logger): Error {
        logger?.error(message)
        return this.forward(new Error(message), logger)
    }

    static forward(error: any, logger?: Logger): any {
        return logger ? new LoggedError(error) : error
    }

    constructor(error: any) {
        super(
            error instanceof Error ? error.message : error,
            { cause: error }
        )
    }
}