import { Server as HttpServer                   } from "http"
import { Application, Router, Request, Response } from "express"
import { Logger                                 } from "winston"

import open              from "open"
import express           from "express"
import morgan            from "morgan"
import AsyncConnection   from "./util/mysql/AsyncConnection"
import LogicError        from "./logic/LogicError"
import TokenExpiredError from "./logic/TokenExpiredError"
import StatusFetcher     from "logic/StatusFetcher"
import Config            from "./Config"

import * as s   from "./util/mysql/statement"
import * as api from "./api"

export default class Server {
    static readonly DEFAULT_ON_STARTED = async (server: Server) => {
        const config = server.config

        if (config.logicOpenBrowser) {
            const logger = server.logger
            
            logger?.info("Opening browser...")
            await open(config.httpAddress)
            logger?.info("Opened")
        }
    }

    private readonly expressApp:  Application
    private          httpServer?: HttpServer

    private runPromise?:        Promise<void>
    private resolveRunPromise?: () => void
    private rejectRunPromise?:  (value: any) => void // For critical errors only

    readonly mysqlConnection: AsyncConnection
    readonly config:          Config
    readonly statusFetcher:   StatusFetcher
    readonly logger?:         Logger

    constructor(config: Config, logger?: Logger) {
        this.mysqlConnection = AsyncConnection.fromConfigServeUser(config, logger)
        this.config          = config
        this.statusFetcher   = new StatusFetcher(this.mysqlConnection, this.config)
        this.logger          = logger
        this.expressApp      = createExpressApp.call(this)

        function createExpressApp(this: Server): Application {
            const app = express()

            if (this.logger)
                setupLogger.call(this)

            setupStatic.call(this)
            setupAPI.call(this)
            setup404.call(this)
            setup500.call(this)

            return app

            function setupLogger(this: Server) {
                const middleware = morgan("tiny", {
                    stream: {
                        write: message => this.logger?.http(message.trim())
                    }
                })

                app.use(middleware)
            }

            function setupAPI(this: Server) {
                const router = createRouter.call(this)

                app.use(this.config.httpPrefix, router)

                const errorHandler = createErrorHandler.call(this)

                router.use(errorHandler)

                function createRouter(this: Server): Router {
                    const router = Router()

                    router.use(api.requireAcceptJson)
                    router.use(api.requireAuthorization)
                    router.use(api.disableGetCache)
                    router.use(express.json())

                    for (const unitName in api.units) {
                        const unit = (api.units as any)[unitName] as api.Unit

                        const handlers = [
                            async (req, res, next) => {
                                try {
                                    if (unit.permission) {
                                        await api.checkPermission(this, unit.permission, req, res, next)
                                        return
                                    }

                                    next()
                                } catch (error) {
                                    handleError(error, res, next)
                                }
                            },

                            async (req, res, next) => {
                                try {
                                    await unit.handler.call(this, req, res)
                                } catch (error) {
                                    handleError(error, res, next)
                                }
                            }
                        ] as ((req: Request, res: Response, next: (error?: any) => void) => Promise<void>)[]

                        router[unit.method](unit.path, handlers)
                    }

                    return router

                    function handleError(error: any, res: Response, next: (error?: any) => void) {
                        if (error instanceof LogicError) {
                            res.json({
                                error:       error.message,
                                needRefresh: error instanceof TokenExpiredError
                            })

                            return
                        }

                        next(error)
                    }
                }

                function createErrorHandler(this: Server) {
                    return (error: Error, req: Request, res: Response, next: () => void) => {
                        this.logger?.error(error)
                        res.sendStatus(500)
                    }
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

            function setup500(this: Server) {
                app.use((error: Error, req: Request, res: Response, next: () => void) => {
                    logger?.error(error)

                    res.status(500).sendFile(config.httpError500Path, error => {
                        if (!error)
                            return

                        this.logger?.error(error)

                        res.end("Internal Server Error")
                    })
                })
            }
        }
    }

    get running(): boolean {
        return this.runPromise != null
    }

    get isApiAvailable(): boolean {
        return this.running
            && this.mysqlConnection.state === "online"
    }

    async start(onStarted: (server: Server) => Promise<void> = Server.DEFAULT_ON_STARTED) {
        if (this.running)
            return

        this.logger?.info(
            this.config.httpServeStatic ? `Starting listening at ${this.config.httpAddress} and serving static content from ${this.config.httpStaticPath}...`
                                        : `Starting listening at ${this.config.httpAddress}...`
        )

        initRunPromise.call(this)
        await initMysqlConnection.call(this)
        await listen.call(this)
        await onStarted(this)

        return await this.runPromise

        function initRunPromise(this: Server) {
            this.runPromise = new Promise<void>((resolve, reject) => {
                this.resolveRunPromise = resolve
                this.rejectRunPromise  = reject
            })
        }

        async function initMysqlConnection(this: Server) {
            this.logger?.info("Initializing database connection...")

            await this.mysqlConnection.connect()
            await s.useDatabase(this.mysqlConnection, this.config.mysqlDatabase)
            
            this.logger?.info("Database connection is initialized")
        }

        async function listen(this: Server) {
            return new Promise<void>(resolve => {
                const socketPath = this.config.read.http?.socketPath
                const listening  = () => {
                    this.logger?.info(this.config.httpServeStatic ? "Listening and serving static content..."
                                                                  : "Listening...")

                    resolve()
                }

                this.httpServer = socketPath != null ? this.expressApp.listen(socketPath, listening)
                                                     : this.expressApp.listen(this.config.httpPort, this.config.httpHost, listening)
            })
        }
    }

    async stop() {
        if (!this.running)
            return

        this.logger?.info("Stopping...")

        await this.mysqlConnection.disconnect()

        this.httpServer?.close(error => {
            if (error)
                this.logger?.error(error)

            this.logger?.info("Stopped")

            this.resolveRunPromise!()
        })

        await this.runPromise
    }
}