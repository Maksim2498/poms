import winston from "winston"

import { Config       } from "./config"
import { initDatabase } from "./init"
import { runServer    } from "./server"

const logger = winston.createLogger({
    format: winston.format.cli(),
    transports: [
        new winston.transports.Console()
    ]
})

main()
    .catch(error => {
        if (!error)
            return

        if (error instanceof Error) {
            if (error.message)
                logger.error(error.message)

            return
        }

        logger.error(error)
    })

async function main() {
    const config = await Config.readFromFile({ logger });

    await initDatabase({ config, logger })
    await runServer({ config, logger })
}