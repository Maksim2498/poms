import cp                                                                              from "child_process"
import open                                                                            from "open"
import express                                                                         from "express"
import morgan                                                                          from "morgan"
import mysql                                                                           from "mysql2/promise"
import LogicError                                                                      from "./logic/LogicError"
import TokenExpiredError                                                               from "./logic/TokenExpiredError"
import Config                                                                          from "./Config"

import { promises as fsp                                                             } from "fs"
import { Server   as HttpServer                                                      } from "http"
import { dirname                                                                     } from "path"
import { Application, Router, Request, Response, RequestHandler, ErrorRequestHandler } from "express"
import { Logger                                                                      } from "winston"
import { Pool, Connection, FieldPacket, ResultSetHeader                              } from "mysql2/promise"
import { TokenManager, DefaultTokenManager                                           } from "./logic/token"
import { UserManager, DefaultUserManager                                             } from "./logic/user"
import { StatusFetcher, DefaultStatusFetcher                                         } from "./logic/status"
import { AuthManager, DefaultAuthManager                                             } from "./logic/auth"
import { NicknameManager, DefaultNicknameManager                                     } from "./logic/nickname"

import * as api                                                                        from "./api"

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

    private  httpServer?:        HttpServer

    private  runPromise?:        Promise<void>
    private  resolveRunPromise?: () => void
    private  rejectRunPromise?:  (value: any) => void // For critical errors only

    private  _state:             State = "created"

    readonly config:             Config
    readonly logger?:            Logger
    readonly statusFetcher:      StatusFetcher
    readonly userManager:        UserManager
    readonly tokenManager:       TokenManager
    readonly authManager:        AuthManager
    readonly nicknameManager:    NicknameManager
    readonly app:                Application
    readonly pool:               Pool

    constructor(config: Config, logger?: Logger) {
        const userManager     = new DefaultUserManager({ config, logger })
        const tokenManager    = new DefaultTokenManager({ userManager, config, logger })
        const nicknameManager = new DefaultNicknameManager({ userManager, config, logger })
        const authManager     = new DefaultAuthManager({ userManager, tokenManager, config, logger })
        const statusFetcher   = new DefaultStatusFetcher({ nicknameManager, config, logger })
        const app             = createApp.call(this)
        const pool            = createPool.call(this)

        this.config           = config
        this.logger           = logger
        this.userManager      = userManager
        this.tokenManager     = tokenManager
        this.nicknameManager  = nicknameManager
        this.authManager      = authManager
        this.statusFetcher    = statusFetcher
        this.app              = app
        this.pool             = pool

        function createApp(this: Server): Application {
            const app = express()

            if (logger)
                setupLogger()

            setupStatic()
            setupAPI.call(this)
            setup404()
            setup500()

            return app

            function setupLogger() {
                const middleware = morgan("tiny", {
                    stream: {
                        write: message => logger!.http(message.trim())
                    }
                })

                app.use(middleware)
            }

            function setupAPI(this: Server) {
                const router = createRouter.call(this)
                const path   = config.httpApiPrefix

                app.use(path, router)

                setup404()
                setupErrorHandler()

                function createRouter(this: Server): Router {
                    const router     = Router()
                    const jsonParser = createJsonParser()

                    router.use(api.requireAcceptJson)
                    router.use(api.disableGetCache)
                    router.use(jsonParser)

                    registerUnits.call(this)

                    return router

                    function createJsonParser(): (RequestHandler | ErrorRequestHandler)[] {
                        return [
                            express.json(),
                            (error: Error, req: Request, res: Response, next: (error: any) => void) => {
                                if (error instanceof SyntaxError) {
                                    res.sendStatus(400)
                                    return
                                }

                                next(error)
                            }
                        ]
                    }

                    function registerUnits(this: Server) {
                        for (const unitName in api.units) {
                            const unit = api.units[unitName]

                            const checkPermission = async (req: Request, res: Response, next: (error?: any) => void) => {
                                try {
                                    if (unit.permission != null)
                                        await api.checkPermission.call(this, unit.permission, req, res)

                                    next()
                                } catch (error) {
                                    next(error)
                                }
                            }

                            const disconnectedHandler = async (req: Request, res: Response, next: (error?: any) => void) => {
                                try {
                                    const handler = unit.handler as api.DisconnectedHandler
                                    await handler.call(this, req, res)
                                } catch (error) {
                                    next(error)
                                }
                            }

                            const connectedHandler = async (req: Request, res: Response, next: (error?: any) => void) => {
                                try {
                                    const connection = await this.pool.getConnection()

                                    try {
                                        await connection.beginTransaction()

                                        const handler = unit.handler as api.ConnectedHandler
                                        await handler.call(this, connection, req, res)

                                        await connection.commit()
                                    } finally {
                                        connection.release()
                                    }
                                } catch (error) {
                                    next(error)
                                }
                            }

                            const handlers = [
                                checkPermission,
                                unit.handler.length === 2 ? disconnectedHandler
                                                          : connectedHandler
                            ]

                            router[unit.method](unit.path, handlers)
                        }
                    }
                }

                function setup404() {
                    router.use((req, res) => res.sendStatus(404))
                }

                function setupErrorHandler() {
                    const handler = (error: Error, req: Request, res: Response, next: () => void) => {
                        if (error instanceof LogicError) {
                            logger?.debug(`Failed: ${error.message}`)
                            
                            res.json({
                                error:       error.message,
                                needRefresh: error instanceof TokenExpiredError
                            })

                            return
                        }

                        logger?.error(error)

                        res.sendStatus(500)
                    }

                    router.use(handler)
                }
            }

            function setupStatic() {
                if (!config.httpServeStatic)
                    return

                const middleware = express.static(config.httpStaticPath)

                app.use(middleware)
            }
        
            function setup404() {
                app.use((req, res) => {
                    res.status(404).sendFile(config.httpError404Path, error => {
                        if (!error)
                            return

                        logger?.error(error)

                        res.end("Page Not Found")
                    })
                })
            }

            function setup500() {
                app.use((error: Error, req: Request, res: Response, next: () => void) => {
                    logger?.error(error)

                    res.status(500).sendFile(config.httpError500Path, error => {
                        if (!error)
                            return

                        logger?.error(error)

                        res.end("Internal Server Error")
                    })
                })
            }
        }

        function createPool(this: Server): Pool {
            const database        = config.mysqlDatabase
            const host            = config.mysqlHost
            const port            = config.mysqlPort
            const socketPath      = config.read.mysql.socketPath
            const useServe        = config.mysqlUseServeUser
            const connectionLimit = config.mysqlConnectionLimit
            const user            = useServe ? config.read.mysql.serve?.login!    : config.read.mysql.login!
            const password        = useServe ? config.read.mysql.serve?.password! : config.read.mysql.password!

            return mysql.createPool({
                database,
                host,
                port,
                socketPath,
                connectionLimit,
                user,
                password,
            })
        }
    }

    async init() {
        this.checkState("created", "initialize")
        this._state = "initializing"

        try {
            this.logger?.info("Initializing server...")
            initWorkingDirectory.call(this)
            await initStatic.call(this)
            await initDatabase.call(this)
            this.logger?.info("Server is successfully initialized")

            this._state = "initialized"
        } catch (error) {
            this._state = "created"
            throw error
        }

        function initWorkingDirectory(this: Server) {
            const wd = dirname(this.config.path)

            this.logger?.info(`Setting working directory to ${wd}...`)
            process.chdir(wd)
            this.logger?.info("Set")
        }

        async function initStatic(this: Server) {
            if (!this.config.logicStaticBuild)
                return

            this.logger?.info("Initializing static content...")
            await createIfNeeded.call(this)
            this.logger?.info("Static content is successfully initialized")

            async function createIfNeeded(this: Server) {
                if (this.config.logicStaticForceBuild) {
                    this.logger?.debug("Creating...")
                    build.call(this)
                    this.logger?.debug("Created")
                    return
                }

                if (await exists.call(this)) {
                    this.logger?.debug("Exits")
                    return
                }

                this.logger?.debug("Doesn't exist. Creating...")
                build.call(this)
                this.logger?.debug("Created")

                async function exists(this: Server): Promise<boolean> {
                    const path = this.config.httpStaticPath

                    this.logger?.debug(`Cheking if static content at ${path} alreading already exists...`)

                    try {
                        const files = await fsp.readdir(path)

                        if (files.length !== 0)
                            return true
                    } catch (error) {
                        if ((error as any).code !== "ENOENT")
                            throw error
                    }

                    return false
                }

                function build(this: Server) {
                    cp.execSync("npm run build", { cwd: this.config.logicStaticBuildPath })
                }
            }
        }

        async function initDatabase(this: Server) {
            this.logger?.info("Initializing database...")

            const connection = await createConnection.call(this)

            try {
                await createObjects.call(this, connection)
            } finally {
                await connection.end()
            }

            this.logger?.info("Database is successfully initialized")

            async function createConnection(this: Server): Promise<Connection> {
                const host       = this.config.mysqlHost
                const port       = this.config.mysqlPort
                const socketPath = this.config.read.mysql.socketPath
                const useInit    = this.config.mysqlUseInitUser
                const user       = useInit ? this.config.read.mysql.init?.login!    : this.config.read.mysql.login!
                const password   = useInit ? this.config.read.mysql.init?.password! : this.config.read.mysql.password!

                return await mysql.createConnection({
                    host,
                    port,
                    socketPath,
                    user,
                    password
                })
            }

            async function createObjects(this: Server, connection: Connection) {
                await createDatabase.call(this)
                await createUsersTable.call(this)
                await createNicknamesTable.call(this)
                await createATokensTable.call(this)
                await createRTokensTable.call(this)
                await createCleanUpEvent.call(this)

                if (this.config.logicAdminCreate)
                    await this.userManager.createAdmin(connection)

                async function createDatabase(this: Server) {
                    const database = this.config.mysqlDatabase

                    this.logger?.debug(`Creating database "${database}"...`)
                    const [result] = await connection.query("CREATE DATABASE IF NOT EXISTS ??", database) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(result.warningStatus === 0 ? "Created" : "Already exists")

                    this.logger?.debug(`Using database "${database}"...`)
                    await connection.query("USE ??", database)
                    this.logger?.debug("Used")
                }

                async function createUsersTable(this: Server) {
                    const sql = "CREATE TABLE IF NOT EXISTS Users ("
                              +     "id            BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                              +     "login         VARCHAR(255) NOT NULL UNIQUE,"
                              +     "name          VARCHAR(255),"
                              +     "cr_id         BIGINT,"
                              +     "cr_time       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                              +     "password_hash BINARY(64)   NOT NULL,"
                              +     "is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,"
                              +     "is_online     BOOLEAN      NOT NULL DEFAULT FALSE,"
                    
                              +     "FOREIGN KEY (cr_id) REFERENCES Users (id) ON DELETE SET NULL"
                              + ")"
                    
                    this.logger?.debug('Creating table "Users"...')
                    const [result] = await connection.query(sql) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(result.warningStatus === 0 ? "Created" : "Already exists")
                }

                async function createNicknamesTable(this: Server) {
                    const sql = "CREATE TABLE IF NOT EXISTS Nicknames ("
                              +     "user_id  BIGINT       NOT NULL,"
                              +     "nickname VARCHAR(255) NOT NULL UNIQUE,"
                    
                              +     "PRIMARY KEY (user_id, nickname),"
                              +     "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
                              + ")"
                    
                    this.logger?.debug('Creating table "Nicknames"...')
                    const [result] = await connection.query(sql) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(result.warningStatus === 0 ? "Created" : "Already exists")
                }

                async function createATokensTable(this: Server) {
                    const sql = "CREATE TABLE IF NOT EXISTS ATokens ("
                              +     "id       BINARY(64) NOT NULL PRIMARY KEY,"
                              +     "user_id  BIGINT     NOT NULL,"
                              +     "cr_time  TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                              +     "exp_time TIMESTAMP  NOT NULL,"
                    
                              +     "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
                              + ")"
                    
                    this.logger?.debug('Creating table "ATokens"...')
                    const [result] = await connection.query(sql) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(result.warningStatus === 0 ? "Created" : "Already exists")
                }

                async function createRTokensTable(this: Server) {
                    const sql = "CREATE TABLE IF NOT EXISTS RTokens ("
                              +     "id        BINARY(64) NOT NULL PRIMARY KEY,"
                              +     "atoken_id BINARY(64) NOT NULL,"
                              +     "cr_time   TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                              +     "exp_time  TIMESTAMP  NOT NULL,"
                    
                              +     "FOREIGN KEY (atoken_id) REFERENCES ATokens (id) ON DELETE CASCADE"
                              + ")"
                    
                    this.logger?.debug('Creating table "RTokens"...')
                    const [results] = await connection.query(sql) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(results.warningStatus === 0 ? "Created" : "Already exists")
                }

                async function createCleanUpEvent(this: Server) {
                    const sql = "CREATE EVENT IF NOT EXISTS CleanUp "
                              + "ON SCHEDULE EVERY 1 DAY "
                              + "DO "
                              +     "DELETE FROM ATokens WHERE id in ("
                              +         "SELECT atoken_id FROM RTokens WHERE exp_time >= now()"
                              +     ")"
                    
                    this.logger?.debug('Creating event "CleanUp"...')
                    const [results] = await connection.query(sql) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(results.warningStatus === 0 ? "Created" : "Already exists")
                }
            }
        }
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

        try {
            log.call(this)
            initRunPromise.call(this)
            await listen.call(this)

            this._state = "running"

            await onStarted(this)
        } catch (error) {
            this._state = "initialized"
            throw error
        }

        function log(this: Server) {
            if (!this.logger)
                return

            const serveStatic = this.config.httpServeStatic
            const address     = this.config.httpAddress
            const message     = serveStatic ? `Starting listening at ${address} and serving static content from ${this.config.httpStaticPath}...`
                                            : `Starting listening at ${address}...`

            this.logger.info(message)
        }

        function initRunPromise(this: Server) {
            this.runPromise = new Promise<void>((resolve, reject) => {
                this.resolveRunPromise = resolve
                this.rejectRunPromise  = reject
            })
        }

        async function listen(this: Server) {
            await new Promise<void>(resolve => {
                const socketPath = this.config.read.http?.socketPath
                const listening  = () => {
                    this.logger?.info(this.config.httpServeStatic ? "Listening and serving static content..."
                                                                  : "Listening...")

                    resolve()
                }

                this.httpServer = socketPath != null ? this.app.listen(socketPath, listening)
                                                     : this.app.listen(this.config.httpPort, this.config.httpHost, listening)
            })
        }
    }

    async stop() {
        this.checkState("running", "stop")
        this._state = "stopping"

        this.logger?.info("Stopping...")

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