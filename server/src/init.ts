import { promises as fsp } from "fs"
import { Connection      } from "mysql"
import { Logger          } from "winston"
import { DeepReadonly    } from "util/type"
import { Config          } from "./config"

import cp from "child_process"

import * as am    from "./util/mysql/async"
import * as s     from "./util/mysql/statement"
import * as t     from "./util/mysql/type"
import * as e     from "./util/error"
import * as logic from "./logic"

const USERS_TABLE: DeepReadonly<t.Table> = {
    name: "Users",

    columns: [
        { name: "id",            type: t.bigint,         primaryKey: true,                  autoIncement: true },
        { name: "login",         type: t.mkVarchar(255), unique:     true                                      },
        { name: "name",          type: t.mkVarchar(255), nullable:   true                                      },
        { name: "cr_id",         type: t.bigint,         nullable:   true                                      },
        { name: "cr_time",       type: t.timestamp,      defaultValue: t.current_timestamp                     },
        { name: "password_hash", type: t.mkBinary(64)                                                          },
        { name: "is_admin",      type: t.boolean,        defaultValue: false                                   },
        { name: "is_online",     type: t.boolean,        defaultValue: false                                   }
    ],
    
    constraints: [
        { type: "foreign_key", field: "cr_id", refTable: "Users", refField: "id", onDelete: "null" }
    ]
}

const NICKNAMES_TABLE: DeepReadonly<t.Table> = {
    name: "Nicknames",

    columns: [
        { name: "user_id",  type: t.bigint                       },
        { name: "nickname", type: t.mkVarchar(255), unique: true }
    ],

    constraints: [
        { type: "primary_key", fields: ["user_id", "nickname"]                     },
        { type: "foreign_key", field: "user_id", refTable: "Users", refField: "id" }
    ]
}

const TOKENS_TABLE: DeepReadonly<t.Table> = {
    name: "Tokens",

    columns: [
        { name: "id",       type: t.mkBinary(64),                primaryKey: true                  },
        { name: "user_id",  type: t.bigint                                                         },
        { name: "exp_time", type: t.timestamp                                                      },
        { name: "cr_time",  type: t.timestamp,                   defaultValue: t.current_timestamp },
        { name: "type",     type: t.mkEnum("access", "refresh")                                    }
    ],

    constraints: [
        { type: "foreign_key", field: "user_id", refTable: "Users", refField: "id" }
    ]
}

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
    else if (config.mysqlValidateTables) {
        const validateOptions = { recreateOnInvalid: config.mysqlRecreateInvalidTables, ...options}
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
    const { connection, logger, recreateOnInvalid } = options

    const valid = await validateTable({ 
        connection,
        logger,
        table:           USERS_TABLE,
        throwOnInvalid: !recreateOnInvalid
    })

    if (valid)
        return true

    await dropTokensTable(options)
    await dropNicknamesTable(options)
    await dropUsersTable(options)

    await createUsersTable(options)
    await createNicknamesTable(options)
    await createTokensTable(options)

    return false
}

async function validateNicknamesTable(options: ValidateSpecificTableOptions) {
    const { connection, logger, recreateOnInvalid } = options

    const valid = await validateTable({ 
        connection,
        logger,
        table:           NICKNAMES_TABLE,
        throwOnInvalid: !recreateOnInvalid
    })

    if (!valid) {
        await dropNicknamesTable(options)
        await createNicknamesTable(options)
    }
}

async function validateTokensTable(options: ValidateSpecificTableOptions) {
    const { connection, logger, recreateOnInvalid } = options

    const valid = await validateTable({ 
        connection,
        logger,
        table:           TOKENS_TABLE,
        throwOnInvalid: !recreateOnInvalid
    })

    if (!valid) {
        await dropTokensTable(options)
        await createTokensTable(options)
    }
}

interface ValidateTableOptions {
    connection:     Connection
    logger?:        Logger
    table:          DeepReadonly<t.Table>
    throwOnInvalid: boolean
}

async function validateTable(options: ValidateTableOptions): Promise<boolean> {
    const valid = await s.isTableValid({ ...options, logInvalidAsError: options.throwOnInvalid })

    if (valid)
        return true

    if (options.throwOnInvalid)
        throw e.fromMessage("Aborting. "
                          + "You can turn off validation or enable automatic fixing of invalid tables. "
                          + "See documentation on configuration for more info", options.logger)

    return false
}

interface SetupDatabaseObjectOptions {
    connection: Connection
    logger?:    Logger
}

async function dropUsersTable(options: SetupDatabaseObjectOptions) {
    await s.dropTable({ ...options, name: "Users" })
}

async function dropNicknamesTable(options: SetupDatabaseObjectOptions) {
    await s.dropTable({ ...options, name: "Nicknames" })
}

async function dropTokensTable(options: SetupDatabaseObjectOptions) {
    await s.dropTable({ ...options, name: "Tokens" })
}

async function createTablesAndEvents(options: SetupDatabaseObjectOptions) {
    await createUsersTable(options)
    await createNicknamesTable(options)
    await createTokensTable(options)
    await createCleanUpEvent(options)
}

async function createUsersTable(options: SetupDatabaseObjectOptions) {
    await s.createTable({ ...options, table: USERS_TABLE     })
}

async function createNicknamesTable(options: SetupDatabaseObjectOptions) {
    await s.createTable({ ...options, table: NICKNAMES_TABLE })
}

async function createTokensTable(options: SetupDatabaseObjectOptions) {
    await s.createTable({ ...options, table: TOKENS_TABLE })
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