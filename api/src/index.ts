import winston from "winston"

import { readConfig, configToURL } from "./config"
import { initDatabase            } from "./init"
import { runServer               } from "./server"

const logger = winston.createLogger({
    format: winston.format.cli(),
    transports: [
        new winston.transports.Console()
    ]
})

main()
    .catch(error => logger.error(error instanceof Error ? error.message : error))

async function main() {
    logger.info("Reading config...")
    const config = await readConfig()
    logger.info("Done")

    const connection = await initDatabase({ config, logger })

    logger.info(`Serving API at ${configToURL(config)}...`)
    await runServer()
    logger.info("Server is closed")
}