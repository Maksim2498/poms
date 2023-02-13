import { Logger     } from "winston"
import { Connection }from "mysql"

/*import { Config, 
         configToDBConnection, 
         DEFAULT_MYSQL_DATABASE } from "./config"

export async function initDatabase(options: { config: Config, logger?: Logger }): Promise<Connection> {
    const { config, logger } = options
    const connection         = configToDBConnection(config)

    await new Promise((resolve, reject) => {
        logger?.info("Connecting to database...")

        connection.connect(error => {
            if (error?.fatal) {
                rejectPromise(new Error(`Failed to connect to database. ${error.sqlMessage}`))
                return
            }

            logger?.info("Connected") 
        })
    })

    return connection



    connection.query(`SHOW DATABASES LIKE "${config.mysql.database ?? "test" }"`, (error, results, fields) => {
        if (error?.fatal) {
            rejectPromise(new Error(`Failed to make a query. ${error.sqlMessage}`))
            return
        }

        for (const field in results[0])
            logger?.info(field)

        logger?.info("Disconnecting from database...") 
    })
}

async function connect(options: { config: Config, connection: Connection, logger?: Logger }): Promise<void> {
    await new Promise((resolve, reject) => {
        options.logger?.info(`Connecting to the database at ${0}`)
    })
}*/