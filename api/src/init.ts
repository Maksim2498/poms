import { Logger                 } from "winston"
import { Connection, MysqlError } from "mysql"

import { Config } from "./config"
import * as am    from "./async_mysql"

export async function initDatabase(options: { config: Config, logger?: Logger }) {
    const { config, logger } = options

    logger?.info("Starting initializing database...")

    const connection  = await connect(options)
    const deepOptions = { connection, config, logger }

    await init(deepOptions)
    await disconnect(deepOptions)

    logger?.info("Database initialization is done")
}

async function connect(options: { config: Config, logger?: Logger }): Promise<Connection> {
    const { config, logger } = options
    const connection         = config.createInitDBConnection()

    logger?.info(`Connecting to the database at ${config.mysqlAddress}...`)
    await am.connect({ connection, logger })
    logger?.info("Connected")

    return connection
}

async function init(options: { connection: Connection, config: Config, logger?: Logger }) {
    const { connection, config, logger } = options
    const database                       = config.mysqlDatabase

    const deepOptions = { connection, database, logger }
    const exists      = await createDatabase(deepOptions)

    if (exists) {

    } else {
        await createTablesAndEvents(deepOptions) 
    }
}

async function createDatabase(options: { connection: Connection, database: string, logger?: Logger }): Promise<boolean> {
    const { connection, database, logger } = options

    logger?.info(`Creating database "${database}"...`)

    const exists = await new Promise<boolean>((resolve, reject) => {
        connection.query("CREATE DATABASE ??", database, error => {
            if (error) {
                if (error.fatal) {
                    reject(new Error(error.sqlMessage ?? error.message ?? am.DEFAULT_FATAL_ERROR_MESSAGE))
                    return
                }

                if (error.code === "ER_DB_CREATE_EXISTS") {
                    resolve(true)
                    return
                }

                logger?.warn(error.sqlMessage ?? error.message ?? am.DEFAULT_ERROR_MESSAGE)
            }

            resolve(false)
        })
    })

    logger?.info(exists ? "Already exits" : "Done")

    return exists
}

async function createTablesAndEvents(options: { connection: Connection, database: string, logger?: Logger }) {
    await useDatabase(options)
    await createUsersTable(options)
    await createCNamesTable(options)
    await createTokensTable(options)
    await createCleanUpEvent(options)
}

async function useDatabase(options: { connection: Connection, database: string, logger?: Logger }) {
    const { connection, database, logger } = options

    logger?.info("Selecting database...")

    await am.query({ 
        connection,
        sql:    "USE ??",
        values: [database],
        logger
    })

    logger?.info("Done")
}

async function createUsersTable(options: { connection: Connection, logger?: Logger }) {
    await createTable({ 
        name: "Users",
        args: [
            "id            BIGINT       AUTO_INCREMENT PRIMARY KEY",
            "login         VARCHAR(255) NOT NULL",
            "name          VARCHAR(255)",
            "password_hash BINARY(64)   NOT NULL",
            "is_admin      BOOLEAN      NOT NULL DEFAULT FALSE"
        ],
        ...options
    })
}

async function createCNamesTable(options: { connection: Connection, logger?: Logger }) {
    await createTable({ 
        name: "CNames",
        args: [
            "user_id BIGINT       PRIMARY KEY",
            "cname   VARCHAR(255) NOT NULL",

            "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
        ],
        ...options
    })
}

async function createTokensTable(options: { connection: Connection, logger?: Logger }) {
    await createTable({ 
        name: "Tokens",
        args: [
            "id      BINARY(64)                PRIMARY KEY",
            "user_id BIGINT                    NOT NULL",
            "exp     TIMESTAMP                 NOT NULL",
            'type    ENUM("access", "refresh") NOT NULL',

            "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
        ],
        ...options
    })
}

async function createTable(options: { name: string, args: string[], connection: Connection, logger?: Logger }) {
    const { name, args, connection, logger } = options

    logger?.info(`Creating ${name} table...`)

    await am.query({
        connection,
        sql: `CREATE TABLE ${name} (${args.join(",")})`,
        logger
    })

    logger?.info("Done")
}

async function createCleanUpEvent(options: { connection: Connection, logger?: Logger }) {
    const { connection, logger } = options

    logger?.info(`Creating CleanUp event...`)

    await am.query({
        connection,
        sql: "CREATE EVENT clean_up "
           + "ON SCHEDULE EVERY 1 DAY "
           + "DO DELETE FROM tokens WHERE exp >= now()",
        logger
    })

    logger?.info("Done")
}

async function disconnect(options: { connection: Connection, logger?: Logger }) {
    const { logger } = options

    logger?.info("Disconnecting from the database...")
    await am.disconnect(options)
    logger?.info("Disconnected")
}