import winston     from "winston"
import LoggedError from "./util/LoggedError"
import Config      from "./Config"
import init        from "./init"
import Server      from "./Server"

const logger = createLogger()

main()
    .catch(error => {
        if (!error || error instanceof LoggedError)
            return

        logger.error(error instanceof Error ? error.message : error)
    })

function createLogger() {
    return winston.createLogger({
        format:     winston.format.cli(),
        transports: [new winston.transports.Console()]
    })
}

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