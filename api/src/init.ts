import { Logger     } from "winston"
import { Connection } from "mysql"

import { Config } from "./config"
import * as am    from "./async_mysql"
import * as logic from "./logic"

export interface InitOptions {
    config:  Config
    logger?: Logger 
}

interface InitOptionsEx extends InitOptions {
    connection: Connection
}

interface SetupOptions {
    connection: Connection
    logger?:    Logger
}

interface SetupDatabaseOptions {
    connection: Connection
    database:   string
    logger?:    Logger
}

interface CreateTabelOptions extends SetupOptions {
    name: string
    args: string[]
}

interface ValidateTableOptions extends SetupOptions {
    name:   string
    fields: {
        name:          string
        type:          string
        nullable?:     boolean
        key?:          string
        defaultValue?: string
        extra?:        string
    }[]
}

export async function initDatabase(options: InitOptions) {
    const { config, logger } = options

    logger?.info("Starting initializing database...")

    const connection  = await connect(options)
    const deepOptions = { connection, config, logger }

    try {
        await init(deepOptions)
    } catch (error) {
        if (error instanceof Error) {
            logger?.error(error.message)
            throw new Error()
        }

        throw error
    } finally {
        await disconnect(deepOptions)
    }

    logger?.info("Database initialization is done")
}

async function connect(options: InitOptions): Promise<Connection> {
    const { config, logger } = options
    const connection         = config.createInitDBConnection()

    logger?.info(`Connecting to the database at ${config.mysqlAddress}...`)
    await am.connect({ connection, logger })
    logger?.info("Connected")

    return connection
}

async function init(options: InitOptionsEx) {
    const { connection, config, logger } = options
    const database                       = config.mysqlDatabase

    const extraOptions = { connection, database, logger }
    const exists       = await createDatabase(extraOptions)

    await useDatabase(extraOptions)

    if (!exists)
        await createTablesAndEvents(options) 
    else if (config.logicValidateTables) {
        const tables = await getTableList(options)

        if (tables.includes("users")) {
            logger?.info("Found Users table")
            await validateUsersTable(options)
        } else {
            logger?.info("Missing Users table")
            await createUsersTable(options)
        }

        if (tables.includes("cnames")) {
            logger?.info("Found CNames table")
            await validateCNamesTable(options)
        } else {
            logger?.info("Missing CNames table")
            await createCNamesTable(options)
        }

        if (tables.includes("tokens")) {
            logger?.info("Found Tokens table")
            await validateTokensTable(options)
        } else {
            logger?.info("Missing Tokens table")
            await createTokensTable(options)
        }
    }

    if (config.logicCreateAdmin)
        await createAdmin(options)
}

async function createDatabase(options: SetupDatabaseOptions): Promise<boolean> {
    const { connection, database, logger } = options

    logger?.info(`Creating database "${database}"...`)

    const exists = await am.query({
        connection,
        logger,
        sql:       "CREATE DATABASE ??",
        values:    [database],
        onError:   error => error.code === "ER_DB_CREATE_EXISTS" ? true : undefined,
        onSuccess: () => false
    })

    logger?.info(exists ? "Already exits" : "Done")

    return exists
}

async function useDatabase(options: SetupDatabaseOptions) {
    const { connection, database, logger } = options

    logger?.info("Selecting database...")

    await am.query({ 
        connection,
        logger,
        sql:    "USE ??",
        values: [database]
    })

    logger?.info("Done")
}

async function getTableList(options: SetupOptions): Promise<string[]> {
    const { connection, logger } = options

    logger?.info("Getting table list...")
    
    const result = await am.query({
        connection,
        logger,
        sql:       "SHOW TABLES",
        onSuccess: (result, fields) => result.map((r: any) => r[fields![0].name].toLowerCase()) as string[]
    })
    
    logger?.info("Done")

    return result
}

async function validateUsersTable(options: SetupOptions) {
    await validateTable({
        name: "Users",
        fields: [
            { name: "id",            type: "bigint",       key: "PRI", extra: "auto_increment" },
            { name: "login",         type: "varchar(255)", key: "UNI"                          },
            { name: "name",          type: "varchar(255)", nullable: true                      },
            { name: "password_hash", type: "binary(64)"                                        },
            { name: "is_admin",      type: "tinyint(1)",   defaultValue: '0'                   }
        ],
        ...options
    })
}

async function validateCNamesTable(options: SetupOptions) {
    await validateTable({
        name: "CNames",
        fields: [
            { name: "id",      type: "bigint",       key: "PRI", extra: "auto_increment" },
            { name: "user_id", type: "bigint",       key: "MUL"                          },
            { name: "cname",   type: "varchar(255)"                                     }
        ],
        ...options
    })
}

async function validateTokensTable(options: SetupOptions) {
    await validateTable({
        name: "Tokens",
        fields: [
            { name: "id",      type: "binary(64)",               key: "PRI"   },
            { name: "user_id", type: "bigint",                   key: "MUL"   },
            { name: "exp",     type: "timestamp"                              },
            { name: "type",    type: "enum('access','refresh')"               }
        ],
        ...options
    })
}

async function validateTable(options: ValidateTableOptions) {
    const { connection, logger, name, fields } = options

    logger?.info(`Validating ${name} table...`)

    const valid = await am.query({
        connection,
        logger,
        sql:       "DESC ??",
        values:    [name],
        onSuccess: results => {
            if (results.length != fields.length)
                return false

            for (let i = 0; i < results.length; ++i) {
                const { Field, Type, Null,     Key, Default,      Extra } = results[i]
                const { name,  type, nullable, key, defaultValue, extra } = fields[i]

                if (Field            !== name
                 || Type             !== type
                 || (Null === "YES") !=  (nullable ?? false)
                 || Key              !=  (key      ?? "")
                 || Default          !=  defaultValue
                 || Extra            !=  (extra    ?? ""))
                 return false
            }
            
            return true;
        }
    })

    if (valid) {
        logger?.info("Valid")
        return
    }

    throw new Error(`Invalid. If you're sure there is no error disable table validation`)
}

async function createTablesAndEvents(options: SetupOptions) {
    await createUsersTable(options)
    await createCNamesTable(options)
    await createTokensTable(options)
    await createCleanUpEvent(options)
}

async function createUsersTable(options: SetupOptions) {
    await createTable({ 
        name: "Users",
        args: [
            "id            BIGINT       AUTO_INCREMENT PRIMARY KEY",
            "login         VARCHAR(255) NOT NULL UNIQUE",
            "name          VARCHAR(255)",
            "password_hash BINARY(64)   NOT NULL",
            "is_admin      BOOLEAN      NOT NULL DEFAULT FALSE"
        ],
        ...options
    })
}

async function createCNamesTable(options: SetupOptions) {
    await createTable({ 
        name: "CNames",
        args: [
            "id      BIGINT       AUTO_INCREMENT PRIMARY KEY",
            "user_id BIGINT       NOT NULL",
            "cname   VARCHAR(255) NOT NULL",

            "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
        ],
        ...options
    })
}

async function createTokensTable(options: SetupOptions) {
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

async function createTable(options: CreateTabelOptions) {
    const { name, args, connection, logger } = options

    logger?.info(`Creating ${name} table...`)

    await am.query({
        connection,
        logger,
        sql: `CREATE TABLE ${name} (${args.join(",")})`
    })

    logger?.info("Done")
}

async function createCleanUpEvent(options: SetupOptions) {
    const { connection, logger } = options

    logger?.info(`Creating CleanUp event...`)

    await am.query({
        connection,
        logger,
        sql: "CREATE EVENT clean_up "
           + "ON SCHEDULE EVERY 1 DAY "
           + "DO DELETE FROM tokens WHERE exp >= now()"
    })

    logger?.info("Done")
}

async function createAdmin(options: { connection: Connection, logger?: Logger }) {
    const { logger, connection } = options

    logger?.info('Checking if user "admin" exists...')

    const info = await logic.getUserInfo({ login: "admin", logger, connection })

    if (info == null) {
        logger?.info('There is no user "admin". Creating...')

        await logic.createUser({
            connection,
            logger,
            login:    "admin",
            password: "admin",
            isAdmin:  true
         })

        logger?.info("Done")
    } else {
        logger?.info(`User "admin" already exists`)

        if (!info.isAdmin)
            logger?.warn('User "admin" doesn\'t have admin rights')
    }
}

async function disconnect(options: SetupOptions) {
    const { logger } = options

    logger?.info("Disconnecting from the database...")
    await am.disconnect(options)
    logger?.info("Disconnected")
}