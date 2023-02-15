import winston from "winston"

import { LoggedError  } from "./util/error"
import { Config       } from "./config"
import { initDatabase } from "./init"
import { runServer    } from "./server"

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
    await runServer(options)
}