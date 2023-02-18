import { Connection, FieldInfo, MysqlError } from "mysql"
import { Logger                            } from "winston"

import * as e from "util/error"

export const DEFAULT_ERROR_MESSAGE = "MySQL error"

export interface AsyncConnectOptions {
    connection: Connection
    address?:   string
    logger?:    Logger
}

export async function connect(options: AsyncConnectOptions) {
    await new Promise<void>((resolve, reject) => {
        const { connection, logger, address } = options

        logger?.info(address ? `Connecting to the database at ${address}...` : "Connecting to the database...")

        connection.connect(error => {
            if (error) {
                logger?.error(error.sqlMessage ?? error.message ?? DEFAULT_ERROR_MESSAGE) 
                reject(e.forward(error, logger))
                return
            }

            logger?.info("Connected")
            resolve()
        })
    })
}

export interface AsyncDisconnectOptions {
    connection: Connection
    logger?:    Logger
}

export async function disconnect(options: AsyncDisconnectOptions) {
    await new Promise<void>(resolve => {
        const { connection, logger } = options

        logger?.info("Disconnecting from the database...")

        connection.end(error => {
            if (error) {
                logger?.error(error.sqlMessage ?? error.message ?? DEFAULT_ERROR_MESSAGE)
            
                if (!error.fatal)
                    connection.destroy()
            }

            logger?.info("Disconnected")
            resolve()
        })
    })
}

export interface AsyncQueryWithoutReturnValueOptions {
    connection: Connection
    sql:        string
    values?:    any[]
    logger?:    Logger
}

export interface AsyncQueryWithReturnValueOptions<T> {
    connection: Connection
    sql:        string
    values?:    any[]
    logger?:    Logger
    onError?:   AsyncQueryOnError<T>
    onSuccess:  AsyncQueryOnSuccess<T>
}

export type AsyncQueryOnError<T>   = (error: MysqlError) => T | undefined
export type AsyncQueryOnSuccess<T> = (results: any, fields: FieldInfo[] | undefined) => T

export type AsyncQueryOptions<T> = AsyncQueryWithoutReturnValueOptions | AsyncQueryWithReturnValueOptions<T>

export async function query(options: AsyncQueryWithoutReturnValueOptions): Promise<void>

export async function query<T>(options: AsyncQueryWithReturnValueOptions<T>): Promise<T>

export async function query<T> (options: AsyncQueryOptions<T>): Promise<T | void>  {
    return await new Promise<T | void>((resolve, reject) => {
        const { connection, sql, values, logger } = options

        connection.query(
            sql, 
            values ?? [], 
            (error, results, fields) => {
                if (error) {
                    const onError = "onError"in options ? options.onError : null

                    if (onError) {
                        const result = onError(error)

                        if (result !== undefined) {
                            resolve(result)
                            return
                        }
                    }

                    logger?.error(error.sqlMessage ?? error.message ?? DEFAULT_ERROR_MESSAGE)
                    reject(e.forward(error, logger))
                    return
                }

                const onSuccess = "onSuccess" in options ? options.onSuccess : null

                if (onSuccess) {
                    resolve(onSuccess(results, fields))
                    return
                }

                resolve()
            }
        )
    })
}