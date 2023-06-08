import winston from "winston"

export default function createLogger(): winston.Logger {
    const { Console } = winston.transports

    const handlers = [new Console()]

    const {
        combine,
        errors,
        colorize,
        timestamp,
        align,
        printf
    } = winston.format

    return winston.createLogger({
        level:             process.env.NODE_ENV === "production" ? "http" : "debug",
        transports:        handlers,
        exceptionHandlers: handlers,
        rejectionHandlers: handlers,
        format:            combine(
            errors(),
            colorize({ all: true }),
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            align(),
            printf(entry => `[${entry.timestamp}] ${entry.level}: ${entry.message}`)
        )
    })
}