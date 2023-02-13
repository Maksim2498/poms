import winston from "winston"

import { Config } from "./config"
//import { initDatabase            } from "./init"
//import { runServer               } from "./server"

const logger = winston.createLogger({
    format: winston.format.cli(),
    transports: [
        new winston.transports.Console()
    ]
})

main()
    .catch(error => logger.error(error instanceof Error ? error.message : error))

async function main() {
    const config = await Config.readFromFile({ logger });

    /*const connection = await initDatabase({ config, logger })
    connection.destroy()

    logger.info(`Serving API at ${configToAPIAddress(config)}...`)
    await runServer()
    logger.info("Server is closed")*/
}