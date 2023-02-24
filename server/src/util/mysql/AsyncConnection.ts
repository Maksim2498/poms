import { Logger                } from "winston"
import { FieldInfo, MysqlError } from "mysql"
import { normalize             } from "path"

import mysql       from "mysql"
import LoggedError from "util/LoggedError"
import sleep       from "util/sleep"
import Config      from "Config"

export interface CreationOptions {
    logger?:            Logger
    host?:              string
    port?:              number
    socketPath?:        string
    login:              string
    password:           string
    reconnect?:         boolean
    reconnectInterval?: number
}

export type State = "offline"
                  | "connecting"
                  | "reconnecting"
                  | "online"
                  | "disconnecting"

export type OnSuccess<T> = (results: any, fieldInfo: FieldInfo[] | undefined) => T
export type OnError<T>   = (error: MysqlError) => T | undefined

export default class AsyncConnection {
    static fromConfigInitUser(config: Config, logger?: Logger) : AsyncConnection {
        const useInitUser = config.mysqlUseInitUser
        const mysql       = config.read.mysql
        const login       = useInitUser ? mysql?.init!.login!    : mysql?.login!
        const password    = useInitUser ? mysql?.init!.password! : mysql?.password!

        return new AsyncConnection({
            host:       config.mysqlHost,
            port:       config.mysqlPort,
            socketPath: mysql?.socketPath,
            login,
            password,
            logger,
        })
    }

    static fromConfigServeUser(config: Config, logger?: Logger) : AsyncConnection {
        const useServeUser = config.mysqlUseServeUser
        const mysql        = config.read.mysql
        const login        = useServeUser ? mysql?.serve!.login!    : mysql?.login!
        const password     = useServeUser ? mysql?.serve!.password! : mysql?.password!

        return new AsyncConnection({
            host:       config.mysqlHost,
            port:       config.mysqlPort,
            socketPath: mysql?.socketPath,
            reconnect:  true,
            login,
            password,
            logger
        })
    }

    private _connection: mysql.Connection
    private _state:      State = "offline"

    readonly address:           string
    readonly logger?:           Logger
    readonly reconnect:         boolean
    readonly reconnectInterval: number

    constructor(options: CreationOptions) {
        this._connection       = createConnection()
        this.address           = createAddress()
        this.logger            = options.logger
        this.reconnect         = options.reconnect         ?? false
        this.reconnectInterval = options.reconnectInterval ?? 5

        if (this.reconnect)
            setupReconnect.call(this)

        function createConnection(): mysql.Connection {
            return mysql.createConnection({
                host:       options.host,
                port:       options.port,
                socketPath: options.socketPath,
                user:       options.login,
                password:   options.password,
            })
        }

        function createAddress(): string {
            return options.socketPath != null ? `unix:${normalize(options.socketPath)}`
                                              : `${options.host}:${options.port}`
        }

        function setupReconnect(this: AsyncConnection) {
            this.connection.on("error", async (error: MysqlError) => {
                if (!error.fatal || this.state !== "online") 
                    return

                this.logMysqlError(error)
                this.logger?.error("Lost connection with database")

                this._connection.destroy()
                this._connection = createConnection()
                this._state      = "reconnecting"

                while (true) {
                    this.logger?.info(`Trying to reconnect in ${this.reconnectInterval} seconds...`)
                    await sleep(1000 * this.reconnectInterval)
                    
                    try {
                        await this.usafeConnect()
                        break
                    } catch {
                        this.logger?.error("Failed")
                    }
                }
            })
        }
    }

    get connection(): mysql.Connection {
        return this._connection
    }

    get state(): State {
        return this._state
    }

    async connect() {
        if (this.state !== "offline")
            throw LoggedError.fromMessage(`Can connect only in "offline" state. Current state is "${this.state}"`, this.logger)

        await this.usafeConnect()
    }

    private async usafeConnect() {
        await new Promise<void>((resolve, reject) => {
            this.logger?.info(`Connecting to the database at ${this.address}...`)
            this._state = "connecting"

            this.connection.connect(error => {
                if (error) {
                    this.logMysqlError(error)
                    reject(LoggedError.forward(error, this.logger))
                    return
                }

                this.logger?.info("Connected")
                this._state = "online"
                resolve()
            })
        })
    }

    async query<T>(
        sql:       string,
        values:    any | any[] = [],
        onSuccess: OnSuccess<T> = results => results,
        onError:   OnError<T>   = ()      => undefined
    ): Promise<T> {
        if (this.state !== "online")
            throw LoggedError.fromMessage(`Can prerform queries only in "online" state. Current state is "${this.state}"`, this.logger)

        return await new Promise<T>((resolve, reject) => {
            this.connection.query(sql, values, (error, results, fieldInfo) => {
                if (error) {
                    const result = onError(error)
                    
                    if (result !== undefined) {
                        resolve(result)
                        return
                    }

                    this.logMysqlError(error)
                    reject(LoggedError.forward(error, this.logger))
                    return
                }

                resolve(onSuccess(results, fieldInfo))
            })
        })
    }

    async disconnect() {
        if (this.state !== "online")
            throw LoggedError.fromMessage(`Can disconnect only in "online" state. Current state is "${this.state}"`, this.logger)

        await new Promise<void>(resolve => {
            this.logger?.info("Disconnecting from the database...")
            this._state = "disconnecting"

            this.connection.end(error => {
                if (error) {
                    this.logMysqlError(error)

                    if (!error.fatal)
                        this.connection.destroy()
                }

                this.logger?.info("Disconnected")
                this._state = "offline"
                resolve()
            })
        })
    }

    private logMysqlError(error: MysqlError) {
        this.logger?.error(error.sqlMessage ?? error.message ?? error ?? "Unknown MySQL error")
    }
}