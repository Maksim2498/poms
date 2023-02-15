import { Connection, FieldInfo, MysqlError } from "mysql"
import { Logger                            } from "winston"

import * as am from "./async"

export interface ShowTablesOptions {
    connection: Connection
    logger?:    Logger
}

export async function showTables(options: ShowTablesOptions): Promise<string[]> {
    const { connection, logger } = options

    logger?.info("Getting table list...")

    const tables = await am.query({
        connection,
        logger,
        sql:       "SHOW TABLES",
        onSuccess: (results: any[], fields: FieldInfo[] | undefined) => results.map(r => r[fields![0].name].toLowerCase()) as string[]
    })

    logger?.info(`Got: ${tables.map(t => `"${t}"`).join(", ")}`)

    return tables
}

export interface CreateDatabaseOptions {
    connection: Connection
    logger?:    Logger
    name:       string
    use?:       boolean
}

export async function createDatabase(options: CreateDatabaseOptions): Promise<boolean> {
    const { connection, logger, name, use } = options

    logger?.info(`Creating database "${name}"...`)

    const created = await am.query({
        connection,
        logger,
        sql:       "CREATE DATABASE ??",
        values:    [name],
        onError:   (error: MysqlError) => error.code === "ER_DB_CREATE_EXISTS" ? false : undefined,
        onSuccess: () => true
    })

    logger?.info(created ? "Created" : "Already exists")

    if (use)
        await useDatabase(options)

    return created
}

export interface UseDatabaseOptions {
    connection: Connection
    logger?:    Logger
    name:       string
}

export async function useDatabase(options: UseDatabaseOptions) {
    const { connection, logger, name } = options

    logger?.info(`Selecting database "${name}"...`)

    await am.query({
        connection,
        logger,
        sql:    "USE ??",
        values: [name]
    })

    logger?.info("Selected")
}

export interface DropTableOptions {
    connection: Connection
    logger?:    Logger
    name:       string
}

export async function dropTable(options: DropTableOptions) {
    const { connection, logger, name } = options

    logger?.info(`Dropping table "${name}"...`)

    await am.query({
        connection,
        logger,
        sql:    "DROP TABLE ??",
        values: [name]
    })

    logger?.info("Dropped")
}