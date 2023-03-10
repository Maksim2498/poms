import winston   from "winston"
import ErrorList from "./util/ErrorList"
import Config    from "./Config"
import Server    from "./Server"

const logger = createLogger()

main().catch(processError)

async function main() {
    const config = await Config.readFromFile(undefined, logger);
    const server = new Server(config, logger)

    setupSigInt()

    await server.init()
    await server.start()

    function setupSigInt() {
        let stopping = false

        process.on("SIGINT", async () => {
            if (stopping)
                return

            stopping = true
            console.log()
            await server.stop()
            process.exit()
        })
    }
}

function createLogger() {
    const Console = winston.transports.Console
    const fmt     = winston.format

    return winston.createLogger({
        level:             process.env.NODE_ENV === "production" ? "http" : "debug",
        transports:        [new Console()],
        exceptionHandlers: [new Console()],
        rejectionHandlers: [new Console()],
        format:            fmt.combine(
            fmt.errors(),
            fmt.colorize({ all: true }),
            fmt.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            fmt.align(),
            fmt.printf(entry => `[${entry.timestamp}] ${entry.level}: ${entry.message}`)
        )
    })
}

function processError(error: any) {
    if (error instanceof ErrorList)
        for (const subError of error.errors)
            logger.error(subError)
    else
        logger.error(error)

    logger.info("Aborting...")

    process.exit(1)
}