import { Server as HttpServer   } from "http"
import { Application, Router    } from "express"
import { Logger                 } from "winston"
import { Connection, MysqlError } from "mysql"
import { Config                 } from "./config"

import express from "express"
import * as am from "./util/mysql/async"
import sleep   from "util/sleep"

export interface ServerOptions {
    config:  Config
    logger?: Logger
}

export class Server {
    private readonly expressApp:       Application
    private          httpServer?:      HttpServer
    private          mysqlConnection?: Connection

    private runPromise?:        Promise<void>
    private resolveRunPromise?: () => void
    private rejectRunPromise?:  (value: any) => void // For critical errors only

    readonly config:  Config
    readonly logger?: Logger

    constructor(options: ServerOptions) {
        const { config, logger } = options

        this.expressApp = express()
        this.config     = config
        this.logger     = logger

        setupExpressApp.call(this)

        return

        function setupExpressApp(this: Server) {
            const router = createRouter.call(this)

            this.expressApp.use(this.config.apiPrefix, router)
            this.expressApp.use((req, res) => res.status(404).send("Not Found"))
        }

        function createRouter(this: Server): Router {
            const router = Router()

            router.get("/test", (req, res) => res.send("API is active\n"))

            return router
        }
    }

    get available(): boolean {
        return this.runPromise != null && this.mysqlConnection != null
    }

    async start() {
        if (this.runPromise)
            return

        this.logger?.info(`Starting listening at ${this.config.apiAddress}...`)

        initRunPromise.call(this)
        await setupMysqlConnection.call(this)
        listen.call(this)

        return await (this.runPromise as unknown as Promise<void>)

        function initRunPromise(this: Server) {
            this.runPromise = new Promise<void>((resolve, reject) => {
                this.resolveRunPromise = resolve
                this.rejectRunPromise  = reject
            })
        }

        async function setupMysqlConnection(this: Server) {
            this.mysqlConnection = this.config.createServeDBConnection()

            await am.connect({ 
                connection: this.mysqlConnection,
                logger:     this.logger,
                address:    this.config.mysqlAddress
            })

            this.mysqlConnection.on("error", async (error: MysqlError) => {
                if (error.fatal) {
                    this.logger?.error("Lost connection with database")

                    this.mysqlConnection?.destroy()
                    this.mysqlConnection = undefined

                    while (true) {
                        this.logger?.info(`Trying to reconnect in ${this.config.logicReconnectInterval} seconds...`)

                        await sleep(1000 * this.config.logicReconnectInterval)

                        try {
                            const connection = this.config.createServeDBConnection() 

                            await am.connect({ 
                                connection,
                                logger:  this.logger,
                                address: this.config.mysqlAddress
                            })

                            this.mysqlConnection = connection

                            break
                        } catch {}
                    }
                }
            })
        }

        function listen(this: Server) {
            const socketPath = this.config.read.http?.socketPath
            const listening  = () => this.logger?.info("Listening...")

            this.httpServer = socketPath != null ? this.expressApp.listen(socketPath, listening)
                                                 : this.expressApp.listen(this.config.apiPort, this.config.apiHost, listening)
        }
    }

    async stop() {
        if (!this.runPromise)
            return

        this.logger?.info("Stopping...")

        if (this.mysqlConnection)
            await am.disconnect({ connection: this.mysqlConnection, logger: this.logger })

        this.httpServer?.close(error => {
            if (error)
                this.logger?.error(error)

            this.logger?.info("Stopped")
            this.resolveRunPromise!()
        })

        await this.runPromise
    }
}