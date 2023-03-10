import cp              from "child_process"
import AsyncConnection from "./util/mysql/AsyncConnection"
import Config          from "./Config"

import { promises as fsp                                              } from "fs"
import { dirname                                                      } from "path"
import { Logger                                                       } from "winston"
import { USERS_TABLE, NICKNAMES_TABLE, A_TOKENS_TABLE, R_TOKENS_TABLE } from "./tables"
import { createAdmin                                                  } from "logic/user"

import * as s from "./util/mysql/statement"
import * as t from "./util/mysql/Table"

export default async function init(config: Config, logger?: Logger) {
    initWorkingDirectory(config, logger)
    await initStatic(config, logger)
    await initDatabase(config, logger)
}

function initWorkingDirectory(config: Config, logger?: Logger) {
    const wd = dirname(config.path)

    logger?.info(`Setting working directory to ${wd}...`)
    process.chdir(wd)
    logger?.info("Set")
}

async function initStatic(config: Config, logger?: Logger) {
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

async function initDatabase(config: Config, logger?: Logger) {
    logger?.info("Initializing database...")

    const connection = AsyncConnection.fromConfigInitUser(config, logger)

    await connection.connect()

    try {
        await initDatabaseObjects(connection, config)
    } finally {
        await connection.disconnect()
    }

    logger?.info("Database is successfully initialized")
}

async function initDatabaseObjects(connection: AsyncConnection, config: Config) {
    const created = await s.createDatabase(connection, config.mysqlDatabase, true)

    if (created)
        await createTablesAndEvents(connection) 
    else if (config.mysqlValidateTables)
        await checkTablesAndEvents(connection, !config.mysqlRecreateInvalidTables)

    if (config.logicCreateAdmin)
        await createAdmin({ connection })
}

async function createTablesAndEvents(connection: AsyncConnection) {
    await USERS_TABLE.create(connection)
    await NICKNAMES_TABLE.create(connection)
    await A_TOKENS_TABLE.create(connection)
    await R_TOKENS_TABLE.create(connection)
    await createCleanUpEvent(connection)
}

async function createCleanUpEvent(connection: AsyncConnection) {
    connection.logger?.info(`Creating event "CleanUp"...`)

    await connection.query("CREATE EVENT CleanUp "
                         + "ON SCHEDULE EVERY 1 DAY "
                         + "DO "
                         +     "DELETE FROM ATokens WHERE id in ("
                         +         "SELECT atoken_id FROM RTokens WHERE exp_time >= now()"
                         +     ")")

    connection.logger?.info("Created")
}

// Doesn't validate events yet

async function checkTablesAndEvents(connection: AsyncConnection, throwOnInvalid: boolean) {
    const tables = await s.showTables(connection)

    if (await handleTable(USERS_TABLE))
        return

    await handleTable(NICKNAMES_TABLE)
    
    if (await handleTable(A_TOKENS_TABLE))
        return

    await handleTable(R_TOKENS_TABLE)

    async function handleTable(table: t.ReadonlyTable): Promise<boolean> {
        if (tables.includes(table.name))
            return !await checkTable(connection, table, throwOnInvalid)

        await table.create(connection)
        return false
    }
}

async function checkTable(connection: AsyncConnection, table: t.ReadonlyTable, throwOnInvalid?: boolean): Promise<boolean> {
    connection.logger?.info(`Validating table "${table.displayName}"...`)
 
    const invalidReason = await table.validate(connection)

    if (invalidReason === undefined) {
        connection.logger?.info("Valid")
        return true
    }

    if (throwOnInvalid)
        throw new Error(invalidReason)

    connection.logger?.error(invalidReason)

    await table.recreate(connection)

    return false
}