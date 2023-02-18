import { promises as fsp              } from "fs"
import { normalize                    } from "path"
import { Logger                       } from "winston"
import { Connection, createConnection } from "mysql"
import { DeepReadonly                 } from "util/type"
import { deepAssign                   } from "./util/object"

import * as e from "./util/error"
import * as o from "./util/object"

export interface ConfigJSON {
    api?: {
        prefix?:     string
        host?:       string
        port?:       number
        socketPath?: string
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
        maxCNames?:             number
    }
}

export interface ReadConfigFromFileOptions {
    path?:   string
    logger?: Logger
}

export class Config {
    static readonly DEFAULT_PATH                          = "config.json"

    static readonly DEFAULT_API_HOST                      = "localhost"
    static readonly DEFAULT_API_PORT                      = 8000
    static readonly DEFAULT_API_PREFIX                    = "/api"

    static readonly DEFAULT_MYSQL_DATABASE                = "poms"
    static readonly DEFAULT_MYSQL_HOST                    = "localhost"
    static readonly DEFAULT_MYSQL_PORT                    = 3306

    static readonly DEFAULT_LOGIC_CREATE_ADMIN            = true
    static readonly DEFAULT_LOGIC_VALIDATE_TABLES         = true 
    static readonly DEFAULT_LOGIC_RECREATE_INVALID_TABLES = false
    static readonly DEFAULT_LOGIC_RECONNECT_INTERVAL      = 5
    static readonly DEFAULT_LOGIC_MAX_TOKENS              = 10
    static readonly DEFAULT_LOGIC_MAX_CNAMES              = 5

    readonly read: DeepReadonly<ConfigJSON>

    static async readFromFile(options?: ReadConfigFromFileOptions): Promise<Config> {
        const path   = options?.path ?? Config.DEFAULT_PATH
        const logger = options?.logger

        logger?.info("Reading config...")

        const json = await this.readJSON(path, logger)

        this.validateJSON(json, logger)

        const config = new Config(json)

        logger?.info("Done")

        return config
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
                { path: "api.prefix",                  type: "string" },
                { path: "api.host",                    type: "string" },
                { path: "api.port",                    type: "number" },
                { path: "api.socketPath",              type: "string" },

                // MySQL
                { path: "mysql.database",              type: "string" },
                { path: "mysql.host",                  type: "string" },
                { path: "mysql.port",                  type: "number" },
                { path: "mysql.socketPath",            type: "string" },
                { path: "mysql.login",                 type: "string" },
                { path: "mysql.password",              type: "string" },
                { path: "mysql.init.login",            type: "string" },
                { path: "mysql.init.password",         type: "string" },
                { path: "mysql.serve.login",           type: "string" },
                { path: "mysql.serve.password",        type: "string" },

                // Logic
                { path: "logic.createAdmin",           type: "boolean" },
                { path: "logic.validateTables",        type: "boolean" },
                { path: "logic.recreateInvalidTables", type: "boolean" },
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

    constructor(json: ConfigJSON) {
        const read = deepAssign({}, json)

        if (read.api != null) {
            read.api.prefix     = normalize(`/${read.api.prefix ?? ""}`)
            read.api.socketPath = normalizeNullable(read.api.socketPath)
        }

        read.mysql.socketPath = normalizeNullable(read.mysql.socketPath)

        this.read = read

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
        const mysql       = this.read.mysql
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

    get apiAddress(): string {
        const api    = this.read.api
        const host   = api?.host   ?? Config.DEFAULT_API_HOST
        const prefix = api?.prefix ?? Config.DEFAULT_API_PREFIX

        if (api?.socketPath != null)
            return `http://unix:/${api.socketPath}/${prefix}/`

        const port = api?.port ?? Config.DEFAULT_API_PORT

        return `http://${host}:${port}/${prefix}/`
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

    get apiPrefix(): string {
        return this.read.api?.prefix ?? Config.DEFAULT_API_PREFIX
    }

    get apiHost(): string {
        return this.read.api?.host ?? Config.DEFAULT_API_HOST
    }

    get apiPort(): number {
        return this.read.api?.port ?? Config.DEFAULT_API_PORT
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
        return this.read.logic?.maxTokens ?? Config.DEFAULT_LOGIC_MAX_CNAMES
    }
}