import winston from "winston"
import Config  from "./Config"
import init    from "./init"
import Server  from "./Server"

const logger = createLogger()

main().catch(error => {
    logger.error(error)
    logger.info("Aborting...")
    process.exit(1)
})

async function main() {
    const config = await Config.readFromFile(undefined, logger);

    await init(config, logger)

    const server = new Server(config, logger)

    setupSigInt()

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