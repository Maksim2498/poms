import { Connection, FieldInfo, MysqlError } from "mysql"
import { Logger                            } from "winston"

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

export interface AsyncQueryOptions<T> {
    connection: Connection
    sql:        string
    values?:    any[]
    logger?:    Logger
    onError?:   (error: MysqlError) => T | undefined
    onSuccess?: (result: any, fields: FieldInfo[] | undefined) => T
}

export async function query<T> (options: AsyncQueryOptions<T>): Promise<T>  {
    return await new Promise<T>((resolve, reject) => {
        const { connection, sql, values, logger, onError, onSuccess } = options

        connection.query(
            sql, 
            values ?? [], 
            (error, result, fields) => {
                if (error) {
                    if (error.fatal) {
                        reject(new Error(error.sqlMessage ?? error.message ?? "Fatal MySQL error"))
                        return
                    }

                    if (onError) {
                        const result = onError(error)

                        if (result !== undefined) {
                            resolve(result)
                            return
                        }
                    }

                    logger?.warn(error.sqlMessage ?? error.message ?? "Non-fatal MySQL error")
                }

                if (onSuccess !== undefined) {
                    resolve(onSuccess(result, fields))
                    return
                }

                resolve(undefined as T)
            }
        )
    })
}