import winston from "winston"

import { dirname     } from "path"
import { LoggedError } from "./util/error"
import { Config      } from "./config"
import { init        } from "./init"
import { Server      } from "./server"

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

    const wd = dirname(config.path)

    logger.info(`Setting working directory to ${wd}...`)
    process.chdir(wd)
    logger.info("Set")

    await init(options)

    const server = new Server(options)

    let stopping = false

    process.on("SIGINT", async () => {
        if (stopping)
            return

        stopping = true
        console.log()
        await server.stop()
        process.exit()
    })

    await server.start()
}