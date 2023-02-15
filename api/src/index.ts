import winston from "winston"

import { LoggedError  } from "./util/error"
import { Config       } from "./config"
import { initDatabase } from "./init"
import { Server       } from "./server"

const logger = winston.createLogger({
    format:     winston.format.cli(),
    transports: [new winston.transports.Console()]
})

main()
    .catch(error => {
        if (!error || error instanceof LoggedError)
            return

        logger.error(error instanceof Error ? error.message : error)
    })

async function main() {
    const config  = await Config.readFromFile({ logger });
    const options = { config, logger }

    await initDatabase(options)

    const server = new Server(options)

    process.on("SIGINT", async () => {
        console.log()
        await server.stop()
        process.exit()
    })

    await server.start()
}