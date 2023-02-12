import winston from "winston"
import mysql   from "mysql"

import { Config, configToDBConnection } from "./config"

export async function initDatabase(options: { config: Config, logger?: winston.Logger }): Promise<mysql.Connection> {
    const { config, logger } = options
    const connection         = configToDBConnection(config)

    let resolvePromise: () => void
    let rejectPromise:  (value: any) => void

    const promise: Promise<void> = new Promise((resolve, reject) => {
        resolvePromise = resolve
        rejectPromise  = reject
    })

    logger?.info("Connecting to database...")

    connection.connect(error => {
        if (error?.fatal) {
            rejectPromise(new Error(`Failed to connect to database. ${error.sqlMessage}`))
            return
        }

        logger?.info("Connected") 
        logger?.info("Disconnecting from database...") 

        connection.end(error => {
            if (error?.fatal) {
                rejectPromise(new Error(`Failed to disconnect from database. ${error.sqlMessage}`))
                return
            }

            logger?.info("Disconnected") 
        })
    })

    await promise

    return connection
}