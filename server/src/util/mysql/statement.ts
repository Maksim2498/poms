import { Connection, FieldInfo, MysqlError } from "mysql"
import { Logger                            } from "winston"
import { DeepReadonly                      } from "util/type"

import * as am from "./async"
import * as t  from "./type"

export interface IsTableValidOptions {
    connection:         Connection
    logger?:            Logger
    table:              DeepReadonly<t.Table>
    logInvalidAsError?: boolean
}

export async function isTableValid(options: IsTableValidOptions): Promise<boolean> {
    const { connection, logger, table, logInvalidAsError } = options

    logger?.info(`Validating table "${table.name}"...`)

    const valid = await am.query({
        connection,
        logger,
        sql:    "DESC ??",
        values: [table.name],
        onSuccess: (results: any[]) => {
            if (results.length != table.columns.length)
                return false

            for (let i = 0; i < results.length; ++i) {
                const { Field, Type, Null,     Key,          Default,      Extra } = results[i]
                const { name, type,  nullable, defaultValue, autoIncement        } =  table.columns[i]

                if (Field !== name.trim())
                    return false

                if (Type !== t.typeToSQL(type, "lower"))
                    return false

                if ((Null == "YES") != (nullable ?? false))
                    return false

                if (Key !== t.tableFieldToSQLKey(table, name))
                    return false

                if (Default != normalizedDefaultValue())
                    return false

                if (autoIncement && Extra !== "auto_increment")
                    return false

                function normalizedDefaultValue() {
                    switch (typeof defaultValue) {
                        case "boolean":
                            return Number(defaultValue)
                        
                        case "object":
                            if (defaultValue == null)
                                return null
                            
                            return "CURRENT_TIMESTAMP"

                        default:
                            return defaultValue
                    }
                }
            }

            return true
        }
    })

    if (valid)
        logger?.info("Valid")
    else if (logInvalidAsError)
        logger?.error("Invalid")
    else
        logger?.info("Invalid")

    return valid
}

export interface CreateTableOptions {
    connection: Connection
    logger?:    Logger
    table:      DeepReadonly<t.Table>
}

export async function createTable(options: CreateTableOptions) {
    const { connection, logger, table } = options

    logger?.info(`Creating table "${table.name}"...`)

    await am.query({
        connection,
        logger,
        sql: t.tableToSQL(table)
    })

    logger?.info("Created")
}

export interface ClearTableOptions {
    connection: Connection
    logger?:    Logger
    name:       string
}

export async function clearTable(options: ClearTableOptions) {
    const { connection, logger, name } = options

    logger?.warn(`Clearing table "${name}"...`)

    await am.query({
        connection,
        logger,
        sql:    "DELETE FROM ??",
        values: [name]
    })

    logger?.warn("Cleared")
}

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

    logger?.info(tables.length ? `Got: ${tables.map(t => `"${t}"`).join(", ")}` : "There is no tables")

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