import { Connection } from "mysql"
import { Logger     } from "winston"

export const DEFAULT_FATAL_ERROR_MESSAGE = "Fatal MySQL error"
export const DEFAULT_ERROR_MESSAGE       = "Non-fatal MySQL error"

export interface AsyncConnectOptions {
    connection: Connection
    logger?:    Logger
}

export async function connect(options: AsyncConnectOptions) {
    await new Promise<void>((resolve, reject) => {
        const { connection, logger } = options

        connection.connect(error => {
            if (error) {
                if (error.fatal) {
                    reject(new Error(error.sqlMessage ?? error.message ?? DEFAULT_FATAL_ERROR_MESSAGE))
                    return
                }

                logger?.warn(error.sqlMessage ?? error.message ?? DEFAULT_ERROR_MESSAGE)
            }

            resolve()
        })
    })
}

export interface AsyncDisconnectOptions {
    connection: Connection
    logger?:    Logger
}

export async function disconnect(options: AsyncDisconnectOptions) {
    const { connection, logger } = options

    await new Promise<void>(resolve => {
        connection.end(error => {
            if (error) {
                logger?.warn(error.sqlMessage ?? error.message ?? DEFAULT_ERROR_MESSAGE)
            
                if (!error.fatal)
                    connection.destroy()
            }

            resolve()
        })
    })
}

export interface AsyncQueryOptions {
    connection: Connection
    sql:        string
    values?:    any[]
    logger?:    Logger
}

export async function query(options: AsyncQueryOptions) {
    await new Promise<void>((resolve, reject) => {
        const { connection, sql, values, logger } = options

        connection.query(
            sql, 
            values ?? [], 
            (error) => {
                if (error) {
                    if (error.fatal) {
                        reject(new Error(error.sqlMessage ?? error.message ?? "Fatal MySQL error"))
                        return
                    }

                    logger?.warn(error.sqlMessage ?? error.message ?? "Non-fatal MySQL error")
                }

                resolve()
            }
        )
    })
}