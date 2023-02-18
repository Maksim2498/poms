import { promises as fsp } from "fs"
import { Connection      } from "mysql"
import { Logger          } from "winston"
import { Config          } from "./config"

import cp from "child_process"

import * as am    from "./util/mysql/async"
import * as s     from "./util/mysql/statement"
import * as e     from "./util/error"
import * as logic from "./logic"

export interface InitOptions {
    config:  Config
    logger?: Logger
}

export async function init(options: InitOptions) {
    await initStatic(options)
    await initDatabase(options)
}

async function initStatic(options: InitOptions) {
    const { config, logger } = options

    if (!config.logicBuildStatic)
        return

    logger?.info("Initializing static content...")

    const path = config.httpStaticPath

    logger?.info(`Cheking if static content at ${path} alreading already exists...`)

    let exits = false

    try {
        const files = await fsp.readdir(path)

        if (files.length !== 0)
            exits = true
    } catch (error) {
        if ((error as any).code !== "ENOENT")
            throw error
    }

    if (exits)
        logger?.info("Exits")
    else {
        logger?.info("Doesn't exist. Creating...")
        cp.execSync("npm run build", { cwd: config.logicBuildStaticPath })
        logger?.info("Created")
    }

    logger?.info("Static content is successfully initilized")
}

async function initDatabase(options: InitOptions) {
    const { config, logger } = options

    logger?.info("Initializing database...")

    const connection = config.createInitDBConnection()

    await am.connect({ connection, logger, address: config.mysqlAddress })

    try {
        await initDatabaseObjects({ connection, config, logger })
    } finally {
        await am.disconnect({ connection, logger })
    }

    logger?.info("Database is successfully initialized")
}

interface InitDatabaseObjectsOptions {
    connection: Connection
    logger?:    Logger
    config:     Config
}

async function initDatabaseObjects(options: InitDatabaseObjectsOptions) {
    const { connection, config, logger } = options

    const created = await s.createDatabase({ 
        connection,
        logger,
        name: config.mysqlDatabase,
        use:  true
    })

    if (created)
        await createTablesAndEvents(options) 
    else if (config.logicValidateTables) {
        const validateOptions = { recreateOnInvalid: config.logicRecreateInvalidTables, ...options}
        const tables          = await s.showTables(options)
        let   recreatedAll    = false

        if (tables.includes("users"))
            recreatedAll = !await validateUsersTable(validateOptions)
        else
            await createUsersTable(options)

        if (!recreatedAll) {
            if (tables.includes("nicknames"))
                await validateNicknamesTable(validateOptions)
            else
                await createNicknamesTable(options)

            if (tables.includes("tokens"))
                await validateTokensTable(validateOptions)
            else
                await createTokensTable(options)
        }
    }

    if (config.logicCreateAdmin)
        await logic.createAdmin(options)
}

interface ValidateSpecificTableOptions {
    connection:        Connection
    logger?:           Logger
    recreateOnInvalid: boolean
}

async function validateUsersTable(options: ValidateSpecificTableOptions): Promise<boolean> {
    const valid = await validateTable({
        name:           "Users",
        throwOnInvalid: !options.recreateOnInvalid,
        fields: [
            { name: "id",            type: "bigint",       key: "PRI",                        extra: "auto_increment"    },
            { name: "login",         type: "varchar(255)", key: "UNI"                                                    },
            { name: "name",          type: "varchar(255)",                                    nullable: true             },
            { name: "cr_id",         type: "bigint",       key: "MUL",                        nullable: true             },
            { name: "cr_time",       type: "timestamp",    defaultValue: "CURRENT_TIMESTAMP", extra: "DEFAULT_GENERATED" },
            { name: "password_hash", type: "binary(64)"                                                                  },
            { name: "is_admin",      type: "tinyint(1)",   defaultValue: '0'                                             },
            { name: "is_online",     type: "tinyint(1)",   defaultValue: '0'                                             }
        ],
        ...options
    })

    if (valid)
        return true

    const { connection, logger } = options

    await s.dropTable({  connection, logger, name: "Tokens" })
    await s.dropTable({  connection, logger, name: "CNames" })
    await s.dropTable({  connection, logger, name: "Users"  })

    await createUsersTable(options)
    await createNicknamesTable(options)
    await createTokensTable(options)

    return false
}

async function validateNicknamesTable(options: ValidateSpecificTableOptions) {
    const valid = await validateTable({
        name:           "Nicknames",
        throwOnInvalid: !options.recreateOnInvalid,
        fields: [
            { name: "user_id",  type: "bigint",       key: "PRI" },
            { name: "nickname", type: "varchar(255)", key: "PRI" }
        ],
        ...options
    })

    if (!valid) {
        await s.dropTable({ 
            name:       "Nicknames", 
            connection: options.connection, 
            logger:     options.logger
        })

        await createNicknamesTable(options)
    }
}

async function validateTokensTable(options: ValidateSpecificTableOptions) {
    const valid = await validateTable({
        name:           "Tokens",
        throwOnInvalid: !options.recreateOnInvalid,
        fields: [
            { name: "id",      type: "binary(64)",               key: "PRI"                                                    },
            { name: "user_id", type: "bigint",                   key: "MUL"                                                    },
            { name: "exp",     type: "timestamp"                                                                               },
            { name: "cr_time", type: "timestamp",                defaultValue: "CURRENT_TIMESTAMP", extra: "DEFAULT_GENERATED" },
            { name: "type",    type: "enum('access','refresh')"                                                                }
        ],
        ...options
    })

    if (!valid) {
        await s.dropTable({ 
            name:       "Tokens", 
            connection: options.connection, 
            logger:     options.logger
        })

        await createTokensTable(options)
    }
}

interface ValidateTableOptions {
    connection:     Connection
    logger?:        Logger
    name:           string
    throwOnInvalid: boolean
    fields: {
        name:          string
        type:          string
        nullable?:     boolean
        key?:          string
        defaultValue?: string
        extra?:        string
    }[]
}

async function validateTable(options: ValidateTableOptions): Promise<boolean> {
    const { connection, logger, name, fields, throwOnInvalid } = options

    logger?.info(`Validating table "${name}"...`)

    const valid = await am.query({
        connection,
        logger,
        sql:       "DESC ??",
        values:    [name],
        onSuccess: (results: any[]) => {
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
        return true
    }

    if (throwOnInvalid)
        throw e.fromMessage("Invalid. "
                          + "You can turn off validation or enable automatic fixing of invalid tables. "
                          + "See documentation on configuration for more info", logger)

    logger?.info("Invalid")

    return false
}

interface SetupDatabaseObjectOptions {
    connection: Connection
    logger?:    Logger
}

async function createTablesAndEvents(options: SetupDatabaseObjectOptions) {
    await createUsersTable(options)
    await createNicknamesTable(options)
    await createTokensTable(options)
    await createCleanUpEvent(options)
}

async function createUsersTable(options: SetupDatabaseObjectOptions) {
    await createTable({ 
        name: "Users",
        args: [
            "id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login         VARCHAR(255) NOT NULL UNIQUE",
            "name          VARCHAR(255)",
            "cr_id         BIGINT",
            "cr_time       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "password_hash BINARY(64)   NOT NULL",
            "is_admin      BOOLEAN      NOT NULL DEFAULT FALSE",
            "is_online     BOOLEAN      NOT NULL DEFAULT FALSE",

            "FOREIGN KEY (cr_id) REFERENCES Users (id) ON DELETE SET NULL"
        ],
        ...options
    })
}

async function createNicknamesTable(options: SetupDatabaseObjectOptions) {
    await createTable({ 
        name: "Nicknames",
        args: [
            "user_id  BIGINT       NOT NULL",
            "nickname VARCHAR(255) NOT NULL UNIQUE",

            "PRIMARY KEY (user_id, nickname)",
            "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
        ],
        ...options
    })
}

async function createTokensTable(options: SetupDatabaseObjectOptions) {
    await createTable({ 
        name: "Tokens",
        args: [
            "id      BINARY(64)                NOT NULL PRIMARY KEY",
            "user_id BIGINT                    NOT NULL",
            "exp     TIMESTAMP                 NOT NULL",
            "cr_time TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP",
            'type    ENUM("access", "refresh") NOT NULL',

            "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
        ],
        ...options
    })
}

interface CreateTabelOptions {
    connection: Connection
    logger?:    Logger
    name:       string
    args:       string[]
}

async function createTable(options: CreateTabelOptions) {
    const { name, args, connection, logger } = options

    logger?.info(`Creating table "${name}"...`)

    await am.query({
        connection,
        logger,
        sql: `CREATE TABLE ${name} (${args.join(",")})`
    })

    logger?.info("Created")
}

async function createCleanUpEvent(options: SetupDatabaseObjectOptions) {
    const { connection, logger } = options

    logger?.info(`Creating event "CleanUp"...`)

    await am.query({
        connection,
        logger,
        sql: "CREATE EVENT CleanUp "
           + "ON SCHEDULE EVERY 1 DAY "
           + "DO DELETE FROM tokens WHERE exp >= now()"
    })

    logger?.info("Created")
}