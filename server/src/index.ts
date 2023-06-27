import Server       from "server/Server"
import ErrorList    from "util/error/ErrorList"
import createLogger from "util/createLogger"
import Config       from "Config"

const logger = createLogger()

main().catch(processError)

async function main() {
    const config = await Config.fromFile(undefined, logger);
    const server = new Server(config, logger)

    setupSigInt()

    await server.initialize()
    await server.listen()

    function setupSigInt() {
        let stopping = false

        process.on("SIGINT", async () => {
            if (stopping)
                return

            stopping = true
            console.log()
            await server.close()
            process.exit()
        })
    }
}

function processError(error: any) {
    if (error instanceof ErrorList)
        for (const subError of error.errors)
            logger.error(subError)
    else
        logger.error(error)

    process.exit(1)
}