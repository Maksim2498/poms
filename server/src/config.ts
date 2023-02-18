import { promises as fsp              } from "fs"
import { normalize, join, dirname     } from "path"
import { Logger                       } from "winston"
import { Connection, createConnection } from "mysql"
import { DeepReadonly                 } from "util/type"
import { deepAssign                   } from "./util/object"

import * as e from "./util/error"
import * as o from "./util/object"

export interface ConfigJSON {
    http?: {
        prefix?:      string
        host?:        string
        port?:        number
        socketPath?:  string
        serveStatic?: boolean
        staticPath?:  string
    }

    mysql: {
        database?:   string
        host?:       string
        port?:       number
        socketPath?: string
        login?:      string
        password?:   string

        init?: {
            login?:    string
            password?: string
        }

        serve?: {
            login?:    string
            password?: string
        }
    }

    logic?: {
        createAdmin?:           boolean
        validateTables?:        boolean
        recreateInvalidTables?: boolean
        reconnectInterval?:     number
        maxTokens?:             number
        maxNicknames?:          number
        buildStatic?:           boolean
        buildStaticPath?:       string
    }
}

export interface ReadConfigFromFileOptions {
    path?:   string
    logger?: Logger
}

export class Config {
    static readonly FILE_NAME                             = "poms-config.json"

    static readonly DEFAULT_PATH                          = this.FILE_NAME

    static readonly DEFAULT_HTTP_PREFIX                   = "/api"
    static readonly DEFAULT_HTTP_HOST                     = "localhost"
    static readonly DEFAULT_HTTP_PORT                     = 8000
    static readonly DEFAULT_HTTP_SERVE_STATIC             = true
    static readonly DEFAULT_HTTP_STATIC_PATH              = "site/build"

    static readonly DEFAULT_MYSQL_DATABASE                = "poms"
    static readonly DEFAULT_MYSQL_HOST                    = "localhost"
    static readonly DEFAULT_MYSQL_PORT                    = 3306

    static readonly DEFAULT_LOGIC_CREATE_ADMIN            = true
    static readonly DEFAULT_LOGIC_VALIDATE_TABLES         = true 
    static readonly DEFAULT_LOGIC_RECREATE_INVALID_TABLES = false
    static readonly DEFAULT_LOGIC_RECONNECT_INTERVAL      = 5
    static readonly DEFAULT_LOGIC_MAX_TOKENS              = 10
    static readonly DEFAULT_LOGIC_MAX_NICKNAMES           = 5
    static readonly DEFAULT_LOGIC_BUILD_STAITC            = true
    static readonly DEFAULT_LOGIC_BUILD_STAITC_PATH       = "site"

    readonly read: DeepReadonly<ConfigJSON>
    readonly path: string

    static async readFromFile(options?: ReadConfigFromFileOptions): Promise<Config> {
        const logger = options?.logger
        const path   = options?.path ?? await this.findConfig(logger)

        logger?.info("Reading config...")

        const json = await this.readJSON(path, logger)

        this.validateJSON(json, logger)

        const config = new Config(json, path)

        logger?.info("Done")

        return config
    }

    static async findConfig(logger?: Logger): Promise<string> {
        logger?.info("Searching for configuration file...")

        let dir = process.cwd()

        while (true) {
            try {
                const files = await fsp.readdir(dir)

                if (files.includes(this.FILE_NAME)) {
                    const path = join(dir, this.FILE_NAME)
                    logger?.info(`Configuration file found at ${path}`)
                    return path
                }
            } catch {}

            const newDir = dirname(dir)

            if (dir === newDir)
                throw new Error("Configuration file not found")

            dir = newDir
        }
    }

    private static async readJSON(path: string, logger?: Logger): Promise<any> {
        try {
            const buffer = await fsp.readFile(path)
            const string = buffer.toString();

            return JSON.parse(string)
        } catch (error) {
            let message: string = `Failed to open configuration file ${path}`

            if (error instanceof SyntaxError)
                message = `Configuration file ${path} is a malformed json`
            else if (error instanceof Error)
                switch ((error as any).code) {
                    case "ENOENT":
                        message = `Configuration file ${path} not found`, { cause: error }
                        break

                    case "EISDIR":
                        message = `Configuration file ${path} is a directory`
                        break

                    case "EPERM":
                        message = `You have no permission to open configuration file ${path}`
                }

            logger?.error(message)

            throw e.forward(error, logger)
        }
    }

    private static validateJSON(json: any, logger?: Logger) {
        const result = o.validate(json, {
            fields: [
                // API
                { path: "http.prefix",                 type: "string"  },
                { path: "http.host",                   type: "string"  },
                { path: "http.port",                   type: "number"  },
                { path: "http.socketPath",             type: "string"  },
                { path: "http.serveStatic",            type: "boolean" },
                { path: "http.staticPath",             type: "string"  },

                // MySQL
                { path: "mysql.database",              type: "string"  },
                { path: "mysql.host",                  type: "string"  },
                { path: "mysql.port",                  type: "number"  },
                { path: "mysql.socketPath",            type: "string"  },
                { path: "mysql.login",                 type: "string"  },
                { path: "mysql.password",              type: "string"  },
                { path: "mysql.init.login",            type: "string"  },
                { path: "mysql.init.password",         type: "string"  },
                { path: "mysql.serve.login",           type: "string"  },
                { path: "mysql.serve.password",        type: "string"  },

                // Logic
                { path: "logic.createAdmin",           type: "boolean" },
                { path: "logic.validateTables",        type: "boolean" },
                { path: "logic.recreateInvalidTables", type: "boolean" },
                { path: "logic.reconnectInterval",     type: "number"  },
                { path: "maxTokens",                   type: "number"  },
                { path: "maxNicknames",                type: "number"  },
                { path: "buildStatic",                 type: "boolean" },
                { path: "buildStaticPath",             type: "string"  },
            ]
        })

        switch (result.error) {
            case "EXCESS":
                throw e.fromMessage(`Found unknown configuration option "${result.path}"`, logger)

            case "MISSING":
                throw e.fromMessage(`Missing required configuration option "${result.path}"`, logger)

            case "TYPE_MISMATCH":
                throw e.fromMessage(`Configuration option "${result.path}" must be of ${result.expected} type but it's of ${result.got} type`, logger)
        }

        this.validateJSONMysqlCredentials(json)
        this.validateJSONPortFields(json)
    }

    private static validateJSONMysqlCredentials(json: any, logger?: Logger) {
        if ((json.mysql?.login        == null || json.mysql?.password        == null)
         && (json.mysql?.init?.login  == null || json.mysql?.init?.password  == null
          || json.mysql?.serve?.login == null || json.mysql?.serve?.password == null)) {
            let message: string

            if (json.mysql?.login == json.mysql?.password)
                message = 'Missing "mysql.login" and "mysql.password" configuration options'
            else if (json.mysql?.login == null)
                message = 'Missing "mysql.login" configuration option'
            else
                message = 'Missing "mysql.password" configuration option'

            throw e.fromMessage(message, logger)
        }
    }

    private static validateJSONPortFields(json: any, logger?: Logger) {
        this.validateJSONPortField(json, "api.port")
        this.validateJSONPortField(json, "mysql.port")
    }

    private static validateJSONPortField(json: any, path: string, logger?: Logger) {
        const port = o.getField(json, path)

        if (port == null)
            return

        if (!Number.isInteger(port) || port < 0 || port > 65535)
            throw e.fromMessage(`Configuration option "${path}" must be a valid port number (an unsigned integer in range [0, 65535])`, logger)
    }

    constructor(json: ConfigJSON, path?: string) {
        const read = deepAssign({}, json)

        if (read.http != null) {
            read.http.prefix     = normalize(`/${read.http.prefix ?? ""}`)
            read.http.socketPath = normalizeNullable(read.http.socketPath)
            read.http.staticPath = normalizeNullable(read.http.staticPath)
        }

        read.mysql.socketPath = normalizeNullable(read.mysql.socketPath)

        if (read.logic != null)
            read.logic.buildStaticPath = normalizeNullable(read.logic.buildStaticPath)

        this.read = read
        this.path = path ?? Config.DEFAULT_PATH

        function normalizeNullable(path: string | undefined): string | undefined {
            return path != null ? normalize(path) : undefined
        }
    }

    createInitDBConnection(): Connection {
        const useInitUser = this.mysqlUseInitUser
        const mysql       = this.read.mysql
        const login       = useInitUser ? mysql?.init!.login!    : mysql?.login!
        const password    = useInitUser ? mysql?.init!.password! : mysql?.password!

        return createConnection({
            host:       this.mysqlHost,
            port:       this.mysqlPort,
            socketPath: mysql?.socketPath,
            user:       login,
            password,
        })
    }

    createServeDBConnection(): Connection {
        const useServeUser = this.mysqlUseServeUser
        const mysql        = this.read.mysql
        const login        = useServeUser ? mysql?.serve!.login!    : mysql?.login!
        const password     = useServeUser ? mysql?.serve!.password! : mysql?.password!

        return createConnection({
            host:       this.mysqlHost,
            port:       this.mysqlPort,
            socketPath: mysql?.socketPath,
            user:       login,
            password,
        })
    }

    get mysqlHost() {
        return this.read.mysql?.host ?? Config.DEFAULT_MYSQL_HOST
    }

    get mysqlPort() {
        return this.read.mysql?.port ?? Config.DEFAULT_MYSQL_PORT
    }

    get mysqlDatabase(): string {
        return this.read.mysql?.database ?? Config.DEFAULT_MYSQL_DATABASE
    }

    get mysqlAddress(): string {
        const mysql = this.read.mysql

        if (mysql?.socketPath != null)
            return mysql?.socketPath

        const host = mysql?.host ?? Config.DEFAULT_MYSQL_HOST
        const port = mysql?.port ?? Config.DEFAULT_MYSQL_PORT

        return `${host}:${port}`
    }

    get httpAddress(): string {
        const api    = this.read.http
        const host   = api?.host   ?? Config.DEFAULT_HTTP_HOST
        const prefix = api?.prefix ?? Config.DEFAULT_HTTP_PREFIX

        if (api?.socketPath != null)
            return `http://unix:/${api.socketPath}${prefix}/`

        const port = api?.port ?? Config.DEFAULT_HTTP_PORT

        return `http://${host}:${port}${prefix}/`
    }

    get mysqlUseInitUser(): boolean {
        const mysql = this.read.mysql

        return mysql?.init?.login    != null 
            && mysql?.init?.password != null
    }

    get mysqlUseServeUser(): boolean {
        const mysql = this.read.mysql

        return mysql?.serve?.login    != null 
            && mysql?.serve?.password != null
    }

    get httpPrefix(): string {
        return this.read.http?.prefix ?? Config.DEFAULT_HTTP_PREFIX
    }

    get httpHost(): string {
        return this.read.http?.host ?? Config.DEFAULT_HTTP_HOST
    }

    get httpPort(): number {
        return this.read.http?.port ?? Config.DEFAULT_HTTP_PORT
    }

    get httpServeStatic(): boolean {
        return this.read.http?.serveStatic ?? Config.DEFAULT_HTTP_SERVE_STATIC
    }

    get httpStaticPath(): string {   
        return this.read.http?.staticPath ?? Config.DEFAULT_HTTP_STATIC_PATH
    }

    get logicCreateAdmin(): boolean {
        return this.read.logic?.createAdmin ?? Config.DEFAULT_LOGIC_CREATE_ADMIN
    }

    get logicValidateTables(): boolean {
        return this.read.logic?.validateTables ?? Config.DEFAULT_LOGIC_VALIDATE_TABLES
    }

    get logicRecreateInvalidTables(): boolean {
        return this.read.logic?.recreateInvalidTables ?? Config.DEFAULT_LOGIC_RECREATE_INVALID_TABLES
    }

    get logicReconnectInterval(): number {
        return this.read.logic?.reconnectInterval ?? Config.DEFAULT_LOGIC_RECONNECT_INTERVAL
    }

    get logicMaxTokens(): number {
        return this.read.logic?.maxTokens ?? Config.DEFAULT_LOGIC_MAX_TOKENS
    }

    get logicMaxCNames(): number {
        return this.read.logic?.maxTokens ?? Config.DEFAULT_LOGIC_MAX_NICKNAMES
    }

    get logicBuildStatic(): boolean {
        return this.read.logic?.buildStatic ?? Config.DEFAULT_LOGIC_BUILD_STAITC
    }

    get logicBuildStaticPath(): string {
        return this.read.logic?.buildStaticPath ?? Config.DEFAULT_LOGIC_BUILD_STAITC_PATH
    }
}