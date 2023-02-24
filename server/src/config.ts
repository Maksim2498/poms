import { promises as fsp          } from "fs"
import { normalize, join, dirname } from "path"
import { Logger                   } from "winston"
import { DeepReadonly             } from "util/type"
import { deepAssign               } from "./util/object"

import LoggedError from "./util/LoggedError"

import * as o from "./util/object"

export interface ConfigJSON {
    http?: {
        prefix?:       string
        host?:         string
        port?:         number
        socketPath?:   string
        serveStatic?:  boolean
        staticPath?:   string
        error404Path?: string
        error500Path?: string
    }

    mysql: {
        database?:              string
        host?:                  string
        port?:                  number
        socketPath?:            string
        login?:                 string
        password?:              string
        validateTables?:        boolean
        recreateInvalidTables?: boolean
        reconnectInterval?:     number

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

export default class Config {
    static readonly POMS_PATH                             = dirname(dirname(__dirname)) // this file is in /server/src/
    static readonly PLUGIN_PATH                           = join(this.POMS_PATH, "plugin")
    static readonly SERVER_PATH                           = join(this.POMS_PATH, "server")
    static readonly SITE_PATH                             = join(this.POMS_PATH, "site")

    static readonly FILE_NAME                             = "poms-config.json"

    static readonly DEFAULT_PATH                          = this.FILE_NAME

    static readonly DEFAULT_HTTP_PREFIX                   = "/api"
    static readonly DEFAULT_HTTP_HOST                     = "localhost"
    static readonly DEFAULT_HTTP_PORT                     = 8000
    static readonly DEFAULT_HTTP_SERVE_STATIC             = true
    static readonly DEFAULT_HTTP_STATIC_PATH              = this.placehold("<SITE_PATH>/build")
    static readonly DEFAULT_HTTP_ERROR_404_PATH           = this.placehold("<SITE_PATH>/build/404.html")
    static readonly DEFAULT_HTTP_ERROR_500_PATH           = this.placehold("<SITE_PATH>/build/500.html")

    static readonly DEFAULT_MYSQL_DATABASE                = "poms"
    static readonly DEFAULT_MYSQL_HOST                    = "localhost"
    static readonly DEFAULT_MYSQL_PORT                    = 3306
    static readonly DEFAULT_MYSQL_VALIDATE_TABLES         = true 
    static readonly DEFAULT_MYSQL_RECREATE_INVALID_TABLES = false
    static readonly DEFAULT_MYSQL_RECONNECT_INTERVAL      = 5

    static readonly DEFAULT_LOGIC_CREATE_ADMIN            = true
    static readonly DEFAULT_LOGIC_MAX_TOKENS              = 10
    static readonly DEFAULT_LOGIC_MAX_NICKNAMES           = 5
    static readonly DEFAULT_LOGIC_BUILD_STAITC            = true
    static readonly DEFAULT_LOGIC_BUILD_STAITC_PATH       = this.placehold("<SITE_PATH>")

    readonly read: DeepReadonly<ConfigJSON>
    readonly path: string

    static placehold(path: string): string {
        const splits = split(path)

        return splits.map(s => {
            if (!s.isPlaceholder)
                return s.text

            switch (s.text) {
                case "POMS_PATH":
                    return this.POMS_PATH

                case "PLUGIN_PATH":
                    return this.PLUGIN_PATH

                case "SERVER_PATH":
                    return this.SERVER_PATH

                case "SITE_PATH":
                    return this.SITE_PATH

                default:
                    return `<${s.text}>`
            }
        }).join("")

        type Split = {
            text:           string
            isPlaceholder?: boolean
        }

        function split(path: string): Split[] {
            const rawSplits = path.split(/(?<!\\)</)
            const splits    = [] as Split[]

            splits.push({ text: rawSplits[0] })

            for (let i = 1; i < rawSplits.length; ) {
                const rawSplit = rawSplits[i]

                if (rawSplit.includes(">")) {
                    const endIndex = rawSplit.indexOf(">")

                    splits.push({
                        text:          rawSplit.slice(0, endIndex),
                        isPlaceholder: true
                    })

                    splits.push({ text: rawSplit.slice(endIndex + 1) })

                    i += 2

                    continue
                }

                splits.push({ text: rawSplit })

                ++i
            }

            return splits
        }
    }

    static async readFromFile(path?: string, logger?: Logger): Promise<Config> {
        path = path ?? await this.findConfig(logger)

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

            throw LoggedError.forward(error, logger)
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
                { path: "http.error404Path",           type: "string"  },
                { path: "http.error500Path",           type: "string"  },

                // MySQL
                { path: "mysql.database",              type: "string"  },
                { path: "mysql.host",                  type: "string"  },
                { path: "mysql.port",                  type: "number"  },
                { path: "mysql.socketPath",            type: "string"  },
                { path: "mysql.login",                 type: "string"  },
                { path: "mysql.password",              type: "string"  },
                { path: "mysql.validateTables",        type: "boolean" },
                { path: "mysql.recreateInvalidTables", type: "boolean" },
                { path: "mysql.reconnectInterval",     type: "number"  },
                { path: "mysql.init.login",            type: "string"  },
                { path: "mysql.init.password",         type: "string"  },
                { path: "mysql.serve.login",           type: "string"  },
                { path: "mysql.serve.password",        type: "string"  },

                // Logic
                { path: "logic.createAdmin",           type: "boolean" },
                { path: "maxTokens",                   type: "number"  },
                { path: "maxNicknames",                type: "number"  },
                { path: "buildStatic",                 type: "boolean" },
                { path: "buildStaticPath",             type: "string"  },
            ]
        })

        switch (result.error) {
            case "EXCESS":
                throw LoggedError.fromMessage(`Found unknown configuration option "${result.path}"`, logger)

            case "MISSING":
                throw LoggedError.fromMessage(`Missing required configuration option "${result.path}"`, logger)

            case "TYPE_MISMATCH":
                throw LoggedError.fromMessage(`Configuration option "${result.path}" must be of ${result.expected} type but it's of ${result.got} type`, logger)
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

            throw LoggedError.fromMessage(message, logger)
        }
    }

    private static validateJSONPortFields(json: any, logger?: Logger) {
        this.validateJSONPortField(json, "api.port",   logger)
        this.validateJSONPortField(json, "mysql.port", logger)
    }

    private static validateJSONPortField(json: any, path: string, logger?: Logger) {
        const port = o.getField(json, path)

        if (port == null)
            return

        if (!Number.isInteger(port) || port < 0 || port > 65535)
            throw LoggedError.fromMessage(`Configuration option "${path}" must be a valid port number (an unsigned integer in range [0, 65535])`, logger)
    }

    constructor(json: ConfigJSON, path?: string) {
        const read = deepAssign({}, json)

        if (read.http != null) {
            read.http.prefix       = normalize(`/${read.http.prefix ?? ""}`)
            read.http.socketPath   = preparePath(read.http.socketPath)
            read.http.staticPath   = preparePath(read.http.staticPath)
            read.http.error404Path = preparePath(read.http.error404Path)
        }

        read.mysql.socketPath = preparePath(read.mysql.socketPath)

        if (read.logic != null)
            read.logic.buildStaticPath = preparePath(read.logic.buildStaticPath)

        this.read = read
        this.path = path ?? Config.DEFAULT_PATH

        function preparePath(path: string | undefined): typeof path {
            if (path == null)
                return undefined

            return Config.placehold(normalize(path))
        }
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
            return `unix:${mysql!.socketPath}`

        const host = mysql?.host ?? Config.DEFAULT_MYSQL_HOST
        const port = mysql?.port ?? Config.DEFAULT_MYSQL_PORT

        return `${host}:${port}`
    }

    get httpApiAddress(): string {
        const api    = this.read.http
        const host   = api?.host   ?? Config.DEFAULT_HTTP_HOST
        const prefix = api?.prefix ?? Config.DEFAULT_HTTP_PREFIX

        if (api?.socketPath != null)
            return `http://unix:${api.socketPath}${prefix}/`

        const port = api?.port ?? Config.DEFAULT_HTTP_PORT

        return `http://${host}:${port}${prefix}/`
    }

    get httpAddress(): string {
        const api    = this.read.http
        const host   = api?.host ?? Config.DEFAULT_HTTP_HOST

        if (api?.socketPath != null)
            return `http://unix:${api.socketPath}/`

        const port = api?.port ?? Config.DEFAULT_HTTP_PORT

        return `http://${host}:${port}/`
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

    get mysqlValidateTables(): boolean {
        return this.read.mysql?.validateTables ?? Config.DEFAULT_MYSQL_VALIDATE_TABLES
    }

    get mysqlRecreateInvalidTables(): boolean {
        return this.read.mysql?.recreateInvalidTables ?? Config.DEFAULT_MYSQL_RECREATE_INVALID_TABLES
    }

    get mysqlReconnectInterval(): number {
        return this.read.mysql?.reconnectInterval ?? Config.DEFAULT_MYSQL_RECONNECT_INTERVAL
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

    get httpError404Path(): string {
        return this.read.http?.error404Path ?? Config.DEFAULT_HTTP_ERROR_404_PATH
    }

    get httpError500Path(): string {
        return this.read.http?.error500Path ?? Config.DEFAULT_HTTP_ERROR_500_PATH
    }
}