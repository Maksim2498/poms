import cp                from "child_process"
import open              from "open"
import express           from "express"
import morgan            from "morgan"
import AsyncConnection   from "./util/mysql/AsyncConnection"
import LogicError        from "./logic/LogicError"
import TokenExpiredError from "./logic/TokenExpiredError"
import StatusFetcher     from "logic/StatusFetcher"
import Config            from "./Config"

import { promises as fsp                                              } from "fs"
import { Server   as HttpServer                                       } from "http"
import { dirname                                                      } from "path"
import { Application, Router, Request, Response                       } from "express"
import { Logger                                                       } from "winston"
import { ReadonlyTable                                                } from "./util/mysql/Table"
import { USERS_TABLE, NICKNAMES_TABLE, A_TOKENS_TABLE, R_TOKENS_TABLE } from "./tables"
import { createAdmin                                                  } from "./logic/user"

import * as s   from "./util/mysql/statement"
import * as api from "./api"

export type State = "created"
                  | "initializing"
                  | "initialized"
                  | "starting"
                  | "running"
                  | "stopping"

export default class Server {
    static readonly DEFAULT_ON_STARTED = async (server: Server) => {
        const config = server.config

        if (!config.logicOpenBrowser)
            return

        const logger = server.logger
        
        logger?.info("Opening browser...")
        await open(config.httpAddress)
        logger?.info("Opened")
    }

    private readonly expressApp:           Application
    private          httpServer?:          HttpServer

    private          runPromise?:          Promise<void>
    private          resolveRunPromise?:   () => void
    private          rejectRunPromise?:    (value: any) => void // For critical errors only

    private          _state:               State = "created"

    readonly         mysqlInitConnection:  AsyncConnection
    readonly         mysqlServeConnection: AsyncConnection
    readonly         config:               Config
    readonly         statusFetcher:        StatusFetcher
    readonly         logger?:              Logger

    constructor(config: Config, logger?: Logger) {
        this.mysqlInitConnection  = AsyncConnection.fromConfigInitUser(config, logger)
        this.mysqlServeConnection = AsyncConnection.fromConfigServeUser(config, logger)
        this.config               = config
        this.logger               = logger
        this.expressApp           = createExpressApp.call(this)
        this.statusFetcher        = new StatusFetcher(this.mysqlServeConnection, this.config)

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

    async init() {
        this.checkState("created", "initialize")
        this._state = "initializing"

        this.logger?.info("Initializing server...")
        this.initWorkingDirectory()
        await this.initStatic()
        await this.initDatabase()
        this.logger?.info("Server is successfully initialized")

        this._state = "initialized"
    }

    private initWorkingDirectory() {
        const wd = dirname(this.config.path)

        this.logger?.info(`Setting working directory to ${wd}...`)
        process.chdir(wd)
        this.logger?.info("Set")
    }
    
    private async initStatic() {
        if (!this.config.logicBuildStatic)
            return

        this.logger?.info("Initializing static content...")

        const path = this.config.httpStaticPath

        this.logger?.info(`Cheking if static content at ${path} alreading already exists...`)

        let exits = false

        try {
            const files = await fsp.readdir(path)

            if (files.length !== 0)
                exits = true
        } catch (error) {
            if ((error as any).code !== "ENOENT")
                throw error
        }

        if (exits)
            this.logger?.info("Exits")
        else {
            this.logger?.info("Doesn't exist. Creating...")
            cp.execSync("npm run build", { cwd: this.config.logicBuildStaticPath })
            this.logger?.info("Created")
        }

        this.logger?.info("Static content is successfully initialized")
    }

    private async initDatabase() {
        this.logger?.info("Initializing database...")

        await this.mysqlInitConnection.connect()

        try {
            await this.initDatabaseObjects()
        } finally {
            await this.mysqlInitConnection.disconnect()
        }

        this.logger?.info("Database is successfully initialized")
    }

    private async initDatabaseObjects() {
        const created = await s.createDatabase(this.mysqlInitConnection, this.config.mysqlDatabase, true)

        if (created)
            await this.createTablesAndEvents() 
        else if (this.config.mysqlValidateTables)
            await this.checkTablesAndEvents()

        if (this.config.logicCreateAdmin)
            await createAdmin({ connection: this.mysqlInitConnection })
    }

    private async createTablesAndEvents() {
        await USERS_TABLE.create(this.mysqlInitConnection)
        await NICKNAMES_TABLE.create(this.mysqlInitConnection)
        await A_TOKENS_TABLE.create(this.mysqlInitConnection)
        await R_TOKENS_TABLE.create(this.mysqlInitConnection)
        await this.createCleanUpEvent()
    }

    private async createCleanUpEvent() {
        this.logger?.info(`Creating event "CleanUp"...`)

        await this.mysqlInitConnection.query("CREATE EVENT CleanUp "
                                           + "ON SCHEDULE EVERY 1 DAY "
                                           + "DO "
                                           +     "DELETE FROM ATokens WHERE id in ("
                                           +         "SELECT atoken_id FROM RTokens WHERE exp_time >= now()"
                                           +     ")")

        this.logger?.info("Created")
    }

    // Doesn't validate events yet

    private async checkTablesAndEvents() {
        const tables = await s.showTables(this.mysqlInitConnection)

        if (await checkOrCreateIfMissing.call(this, USERS_TABLE))
            return // If invalid all tables will be recreated

        await checkOrCreateIfMissing.call(this, NICKNAMES_TABLE)
        
        if (await checkOrCreateIfMissing.call(this, A_TOKENS_TABLE))
            return // If invalid RTokens table will be recreated

        await checkOrCreateIfMissing.call(this, R_TOKENS_TABLE)

        async function checkOrCreateIfMissing(this: Server, table: ReadonlyTable): Promise<boolean> {
            if (tables.includes(table.name))
                return !await this.checkTable(this.mysqlInitConnection, table)

            await table.create(this.mysqlInitConnection)

            return false
        }
    }

    private async checkTable(connection: AsyncConnection, table: ReadonlyTable): Promise<boolean> {
        connection.logger?.info(`Validating table "${table.displayName}"...`)
    
        const invalidReason = await table.validate(connection)

        if (invalidReason === undefined) {
            connection.logger?.info("Valid")
            return true
        }

        if (!this.config.mysqlRecreateInvalidTables)
            throw new Error(invalidReason)

        connection.logger?.error(invalidReason)

        await table.recreate(connection)

        return false
    }

    get isApiAvailable(): boolean {
        return this.state                 === "running"
            && this.mysqlServeConnection.state === "online"
    }

    get state(): State {
        return this._state
    }

    async finish(): Promise<void> {
        await this.runPromise
    }

    async start(onStarted: (server: Server) => Promise<void> = Server.DEFAULT_ON_STARTED) {
        this.checkState("initialized", "start")
        this._state = "starting"

        if (this.logger) {
            const serveStatic = this.config.httpServeStatic
            const address     = this.config.httpAddress
            const message     = serveStatic ? `Starting listening at ${address} and serving static content from ${this.config.httpStaticPath}...`
                                            : `Starting listening at ${address}...`

            this.logger.info(message)
        }

        initRunPromise.call(this)
        await initMysqlConnection.call(this)
        await listen.call(this)

        this._state = "running"

        await onStarted(this)

        function initRunPromise(this: Server) {
            this.runPromise = new Promise<void>((resolve, reject) => {
                this.resolveRunPromise = resolve
                this.rejectRunPromise  = reject
            })
        }

        async function initMysqlConnection(this: Server) {
            this.logger?.info("Initializing database connection...")

            await this.mysqlServeConnection.connect()
            await s.useDatabase(this.mysqlServeConnection, this.config.mysqlDatabase)
            
            this.logger?.info("Database connection is successfully initialized")
        }

        async function listen(this: Server) {
            await new Promise<void>(resolve => {
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
        this.checkState("running", "stop")
        this._state = "stopping"

        this.logger?.info("Stopping...")

        await this.mysqlServeConnection.disconnect()

        this.httpServer?.close(error => {
            if (error)
                this.logger?.error(error)

            this.logger?.info("Stopped")

            this._state = "initialized"

            this.resolveRunPromise!()
        })

        await this.runPromise
    }

    private checkState(required: State, action: string) {
        if (this.state !== required)
            throw new Error(`Server cannot ${action} while it's in "${this.state}" state. It must be in "${required}" state`)
    }
}