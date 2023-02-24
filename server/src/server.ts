import { Server as HttpServer                   } from "http"
import { Application, Router, Request, Response } from "express"
import { Logger                                 } from "winston"

import shortUuid       from "short-uuid"
import express         from "express"
import AsyncConnection from "util/mysql/AsyncConnection"
import Config          from "./Config"

export default class Server {
    private readonly expressApp:  Application
    private          httpServer?: HttpServer

    private runPromise?:        Promise<void>
    private resolveRunPromise?: () => void
    private rejectRunPromise?:  (value: any) => void // For critical errors only

    readonly mysqlConnection: AsyncConnection
    readonly config:          Config
    readonly logger?:         Logger

    constructor(config: Config, logger?: Logger) {
        this.mysqlConnection = AsyncConnection.fromConfigServeUser(config, logger)
        this.config          = config
        this.logger          = logger
        this.expressApp      = createExpressApp.call(this)

        function createExpressApp(this: Server): Application {
            const app = express()

            if (this.logger)
                setupLogger.call(this)

            setupAPI.call(this)
            setupStatic.call(this)
            setup404.call(this)
            setup500.call(this)

            return app

            function setupLogger(this: Server) {
                app.use((req, res, next) => {
                    (req as any).id = shortUuid.generate()
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

            function setup500(this: Server) {
                app.use((error: Error, req: Request, res: Response, next: () => void) => {
                    logger?.error(error.message)

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

    async start() {
        if (this.running)
            return

        this.logger?.info(
            this.config.httpServeStatic ? `Starting listening at ${this.config.httpAddress} and serving static content from ${this.config.httpStaticPath}...`
                                        : `Starting listening at ${this.config.httpAddress}...`
        )

        initRunPromise.call(this)
        await this.mysqlConnection.connect()
        listen.call(this)

        return await this.runPromise

        function initRunPromise(this: Server) {
            this.runPromise = new Promise<void>((resolve, reject) => {
                this.resolveRunPromise = resolve
                this.rejectRunPromise  = reject
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