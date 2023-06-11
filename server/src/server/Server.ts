import cp                                                              from "child_process"
import path                                                            from "path"
import mysql                                                           from "mysql2/promise"
import Config                                                          from "Config"
import UserRole                                                        from "logic/user/UserRole"
import UserManager                                                     from "logic/user/UserManager"
import CacheManager                                                    from "util/buffer/CacheManager"
import ServerState                                                     from "./ServerState"

import { promises   as fsp                                           } from "fs"
import { Connection as MysqlConnection, ResultSetHeader, FieldPacket } from "mysql2/promise"
import { Logger                                                      } from "winston"

export default class Server {
    private  _state:  ServerState = ServerState.CREATED

    readonly config:       Config
    readonly cacheManager: CacheManager
    readonly userManager:  UserManager
    readonly logger:       Logger | null

    constructor(config: Config, logger: Logger | null = null) {
        const cacheManager = new CacheManager(config.read.mysql.cacheSize)
        const userManager  = new UserManager({
            cacheManager,
            config,
            logger,
        })

        this.config       = config
        this.cacheManager = cacheManager
        this.userManager  = userManager
        this.logger       = logger

        // TODO

        logger?.debug("Server created")
    }

    get state(): ServerState {
        return this._state
    }

    async initialize() {
        this._stepState(ServerState.CREATED, ServerState.INITIALIZING, "be initialized")

        try {
            this.logger?.verbose("Initializing server...")

            initializeWorkingDirectory.call(this)
            await initializeStaticContent.call(this)
            await initializeDatabase.call(this)
            await initializeSocketPaths.call(this)

            this.logger?.verbose("Server is successfully initialized")
        } catch (error) {
            this._state = ServerState.CREATED
            throw error
        }

        this._state = ServerState.INITIALIZED

        function initializeWorkingDirectory(this: Server) {
            const configPath = this.config.path

            if (configPath == null)
                return

            const workingDirectory = path.dirname(configPath)

            this.logger?.verbose(`Setting working directory to ${workingDirectory}...`)
            process.chdir(workingDirectory)
            this.logger?.verbose("Set")
        }

        async function initializeStaticContent(this: Server) {
            if (!this.config.read.logic.static.build)
                return

            this.logger?.verbose("Initializing static content...")
            await buildIfNeeded.call(this)
            this.logger?.verbose("Static conent is successfully initialized")

            async function buildIfNeeded(this: Server) {
                this.logger?.verbose(`Checking if already exits at ${this.config.read.http.staticPath}...`)

                const buildExists = await exists.call(this)

                this.logger?.verbose("Exists")

                if (buildExists) {
                    if (this.config.read.logic.static.forceBuild) {
                        this.logger?.verbose("Rebuilding...")
                        build.call(this)
                        this.logger?.verbose("Rebuilt")
                    }

                    return
                }

                this.logger?.verbose("Building...")
                build.call(this)
                this.logger?.verbose("Built")

                async function exists(this: Server): Promise<boolean> {
                    try {
                        const files = await fsp.readdir(this.config.read.http.staticPath)
                        return files.length !== 0
                    } catch (error) {
                        if ((error as any).code !== "ENOENT")
                            throw error

                        return false
                    }
                }

                function build(this: Server) {
                    const command = "npm run build"
                    const cwd     = this.config.read.logic.static.buildPath

                    this.logger?.debug(`Executing "${command}" at ${cwd}...`)
                    cp.execSync(command, { cwd })
                    this.logger?.debug("Success")
                }
            }
        }

        async function initializeDatabase(this: Server) {
            this.logger?.verbose("Initializing database...")

            const connection = await createConnection.call(this)

            try {
                await createObjects.call(this)
            } finally {
                await connection.end()
            }

            this.logger?.verbose("Database is successfully initialized")

            async function createConnection(this: Server): Promise<MysqlConnection> {
                const host       = this.config.read.mysql.host
                const port       = this.config.read.mysql.port
                const socketPath = this.config.read.mysql.socketPath ?? undefined
                const useInit    = this.config.useMysqlInitializeUser
                const user       = useInit ? this.config.read.mysql.initialize.login!    : this.config.read.mysql.login!
                const password   = useInit ? this.config.read.mysql.initialize.password! : this.config.read.mysql.password!

                return await mysql.createConnection({
                    host,
                    port,
                    socketPath,
                    user,
                    password
                })
            }

            async function createObjects(this: Server) {
                await createDatabase.call(this)
                await createUsersTable.call(this)
                await createNicknamesTable.call(this)
                await createTokensTable.call(this)
                await createCleanUpEvent.call(this)
                await createOwner.call(this)

                return

                async function createDatabase(this: Server) {
                    const database = this.config.read.mysql.database

                    this.logger?.debug(`Creating database "${database}"...`)
                    const [result] = await connection.query("CREATE DATABASE IF NOT EXISTS ??", database) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(result.warningStatus === 0 ? "Created" : "Already exists")

                    this.logger?.debug(`Using database "${database}"...`)
                    await connection.query("USE ??", database)
                    this.logger?.debug("Used")
                }

                async function createUsersTable(this: Server) {
                    const sql = "CREATE TABLE IF NOT EXISTS Users ("
                              +     "id            BIGINT                                   NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                              +     "login         VARCHAR(255)                             NOT NULL UNIQUE,"
                              +     "name          VARCHAR(255),"
                              +     "icon          MEDIUMBLOB,"
                              +     "cr_id         BIGINT,"
                              +     "cr_time       TIMESTAMP                                NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                              +     "mod_time      TIMESTAMP                                NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
                              +     "password_hash BINARY(64)                               NOT NULL,"
                              +     "role          ENUM('user','moderator','admin','owner') NOT NULL DEFAULT 'user',"
                              +     "is_online     BOOLEAN                                  NOT NULL DEFAULT FALSE,"
                    
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

                async function createTokensTable(this: Server) {
                    const sql = "CREATE TABLE IF NOT EXISTS Tokens ("
                              +     "access_id        BINARY(64) NOT NULL UNIQUE DEFAULT (RANDOM_BYTES(64)),"
                              +     "refresh_id       BINARY(64) NOT NULL UNIQUE DEFAULT (RANDOM_BYTES(64)),"
                              +     "user_id          BIGINT,"
                              +     "cr_time          TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                              +     "access_exp_time  TIMESTAMP  NOT NULL,"
                              +     "refresh_exp_time TIMESTAMP  NOT NULL,"
                    
                              +     "FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE"
                              + ")"

                    this.logger?.debug('Creating table "Tokens"...')
                    const [result] = await connection.query(sql) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(result.warningStatus === 0 ? "Created" : "Already exists")
                }

                async function createCleanUpEvent(this: Server) {
                    const sql = "CREATE EVENT IF NOT EXISTS CleanUp "
                              + "ON SCHEDULE EVERY 1 DAY "
                              + "DO "
                              +     "DELETE FROM Tokens WHERE refresh_exp_time <= now()"

                    this.logger?.debug('Creating event "CleanUp"...')
                    const [results] = await connection.query(sql) as [ResultSetHeader, FieldPacket[]]
                    this.logger?.debug(results.warningStatus === 0 ? "Created" : "Already exists")
                }

                async function createOwner(this: Server) {
                    const { owner } = this.config.read.logic

                    if (!owner.create)
                        return

                    const {
                        login,
                        password,
                        name,
                        nicknames,
                    } = owner

                    this.logger?.verbose(`Creating owner user ${login}...`)

                    if (await this.userManager.hasWithLogin(connection, login)) {
                        this.logger?.verbose("Such user already exists")
                        return
                    }

                    await this.userManager.create(connection, {
                        role: UserRole.OWNER,
                        login,
                        password,
                        name,
                        nicknames,
                    })
                
                    this.logger?.verbose("Craeted")
                }
            }
        }

        async function initializeSocketPaths(this: Server) {
            const httpSocketPath = this.config.read.http.socketPath

            if (httpSocketPath != null) {
                this.logger?.verbose(`Removing old HTTP socket at ${httpSocketPath}...`)
                await remove.call(this, httpSocketPath)
            }

            const mysqlSocketPath = this.config.read.mysql.socketPath

            if (mysqlSocketPath != null) {
                this.logger?.verbose(`Removing old MySQL socket at ${mysqlSocketPath}...`)
                await remove.call(this, mysqlSocketPath)
            }

            async function remove(this: Server, path: string) {
                try {
                    await fsp.rm(path)
                    this.logger?.verbose("Removed")
                } catch (error) {
                    if ((error as any).code !== "ENOENT")
                        throw error

                    this.logger?.verbose("Doesn't exist")
                }
            }
        }
    }

    async listen() {
        this._stepState(ServerState.INITIALIZED, ServerState.OPENING, "start listening")

        try {
            // TODO
        } catch (error) {
            this._state = ServerState.INITIALIZED
            throw error
        }

        this._state = ServerState.LISTENING
    }

    async close() {
        this._stepState(ServerState.LISTENING, ServerState.CLOSING, "be closed")

        try {
            // TODO
        } catch (error) {
            this.logger?.warn(error)
        }

        this._state = ServerState.INITIALIZED
    }

    private _stepState(from: ServerState, to: ServerState, forAction?: string) {
        this._checkState(from, forAction)
        this._state = to
    }

    private _checkState(required: ServerState, forAction: string = "do this") {
        if (this.state !== required)
            throw new Error(`Server cannot ${forAction} while it's in "${this.state}" state. It must be in "${required}" state`)
    }
}