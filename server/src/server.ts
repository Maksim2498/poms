import { Server as HttpServer   } from "http"
import { Application, Router    } from "express"
import { Logger                 } from "winston"
import { Connection, MysqlError } from "mysql"
import { Config                 } from "./config"

import shortUUID from "short-uuid"
import express  from "express"
import * as am  from "./util/mysql/async"
import sleep    from "util/sleep"

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
            const app = this.expressApp

            if (this.logger)
                setupLogger.call(this)

            setupAPI.call(this)
            setupStatic.call(this)
            setup404.call(this)

            function setupLogger(this: Server) {
                app.use((req, res, next) => {
                    (req as any).id = shortUUID.generate()
                    next()
                })

                app.use((req, res, next) => {
                    const id     = (req as any).id
                    const method = req.method
                    const url    = req.url

                    this.logger!.info(`[${id}] - ${method} ${decodeURI(url)}`)
                    res.on("close", () => this.logger!.info(`[${id}] - ${res.statusCode}`))

                    next()
                })
            }

            function setupAPI(this: Server) {
                const router = createRouter.call(this)

                app.use(this.config.httpPrefix, router)

                function createRouter(this: Server): Router {
                    const router = Router()

                    router.get("/test", (req, res) => res.send("API is working loud and sound!\n"))

                    return router
                }
            }

            function setupStatic(this: Server) {
                if (!this.config.httpServeStatic)
                    return

                app.use(express.static(this.config.httpStaticPath))
            }
        
            function setup404(this:Server) {
                app.use((req, res) => {
                    res.status(404).sendFile(config.httpError404Path, error => {
                        if (!error)
                            return

                        this.logger?.error(error)
                        res.end("Page Not Found")
                    })
                })
            }
        }
    }

    get available(): boolean {
        return this.runPromise != null && this.mysqlConnection != null
    }

    async start() {
        if (this.runPromise)
            return

        this.logger?.info(
            this.config.httpServeStatic ? `Starting listening at ${this.config.httpAddress} and serving static content from ${this.config.httpStaticPath}...`
                                        : `Starting listening at ${this.config.httpAddress}...`
        )

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
                        this.logger?.info(`Trying to reconnect in ${this.config.mysqlReconnectInterval} seconds...`)

                        await sleep(1000 * this.config.mysqlReconnectInterval)

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
            const listening  = () => this.logger?.info(
                this.config.httpServeStatic ? "Listening and serving static content..."
                                            : "Listening..."
            )

            this.httpServer = socketPath != null ? this.expressApp.listen(socketPath, listening)
                                                 : this.expressApp.listen(this.config.httpPort, this.config.httpHost, listening)
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