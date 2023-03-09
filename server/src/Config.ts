import z         from "zod"
import ErrorList from "util/ErrorList"

import { promises as fsp          } from "fs"
import { normalize, join, dirname } from "path"
import { Logger                   } from "winston"
import { DeepReadonly             } from "util/type"
import { deepAssign               } from "./util/object"

const OPORT     = z.number().int().nonnegative().max(65535).optional()
const OSTRING   = z.string().optional()
const OHOST     = z.string().transform(s => s.trim()).optional()
const OURI_PATH = z.string().transform(s => normalize("/" + s)).optional()
const OPATH     = z.string().transform(s => Config.placehold(normalize(s))).optional()
const OBOOLEAN  = z.boolean().optional()
const OUINT     = z.number().int().nonnegative().optional()
const ODB_NAME  = z.string().regex(/^\w+$/, { message: 'Configuration option "mysql.database" is an invalid database identifier' }).optional()

const CONFIG_JSON_SCHEMA = z.object({
    http: z.object({
        apiPrefix:             OURI_PATH,
        host:                  OHOST,
        port:                  OPORT,
        socketPath:            OPATH,
        serveStatic:           OBOOLEAN,
        staticPath:            OPATH,
        error404Path:          OPATH,
        error500Path:          OPATH,
    }).strict().optional(),

    mysql: z.object({
        database:              ODB_NAME,
        host:                  OHOST,
        port:                  OPORT,
        socketPath:            OPATH,
        login:                 OSTRING,
        password:              OSTRING,
        validateTables:        OBOOLEAN,
        recreateInvalidTables: OBOOLEAN,
        reconnectInterval:     OUINT,

        init: z.object({
            login:             OSTRING,
            password:          OSTRING
        }).strict().optional(),

        serve: z.object({
            login:             OSTRING,
            password:          OSTRING
        }).strict().optional()
    }).strict(),

    logic: z.object({
        createAdmin:           OBOOLEAN,
        maxTokens:             OUINT,
        maxNicknames:          OUINT,
        buildStatic:           OBOOLEAN,
        buildStaticPath:       OPATH,
        openBrowser:           OBOOLEAN
    }).strict().optional(),

    rcon: z.object({
        host:                  OHOST,
        port:                  OPORT,
        password:              OSTRING
    }).strict().optional(),

    mc: z.object({
        host:                  OHOST,
        port:                  OPORT,
        statusLifetime:        OUINT
    }).strict().optional()
})

export type ConfigJson = z.infer<typeof CONFIG_JSON_SCHEMA>

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

    static readonly DEFAULT_HTTP_API_PREFIX               = "/api"
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
    static readonly DEFAULT_LOGIC_OPEN_BROWSER            = true

    static readonly DEFAULT_RCON_HOST                     = "localhost"
    static readonly DEFAULT_RCON_PORT                     = 25575

    static readonly DEFAULT_MC_HOST                       = "localhost"
    static readonly DEFAULT_MC_PORT                       = 25565
    static readonly DEFAULT_MC_STATUS_LIFETIME            = 10

    readonly read: DeepReadonly<ConfigJson>
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

        const json   = await this.readJson(path)
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

    private static async readJson(path: string): Promise<any> {
        try {
            const buffer = await fsp.readFile(path)
            const string = buffer.toString();

            try {
                return JSON.parse(string)
            } catch (error) {
                throw new Error(`Configuration file ${path} is a malformed json`, { cause: error })
            }
        } catch (error) {
            if (error instanceof Error)
                switch ((error as any).code) {
                    case "ENOENT":
                        throw new Error(`Configuration file ${path} not found`, { cause: error })

                    case "EISDIR":
                        throw new Error(`Configuration file ${path} is a directory`, { cause: error })

                    case "EPERM":
                        throw new Error(`You have no permission to open configuration file ${path}`, { cause: error })
                }

            throw new Error(`Failed to open configuration file ${path}`, { cause: error })
        }
    }

    constructor(json: any, path?: string) {
        const parsedJson = CONFIG_JSON_SCHEMA.safeParse(json, { errorMap: Config.zodErrorMap })

        if (!parsedJson.success)
            throw Config.zodErrorToErrorList(parsedJson.error)

        Config.validateParsedJsonMysqlCredentials(parsedJson.data)

        const read = deepAssign({}, parsedJson.data)
        
        this.read = read
        this.path = path ?? Config.DEFAULT_PATH
    }

    private static zodErrorMap(issue: z.ZodIssueOptionalMessage, ctx: { defaultError: string, data: any }): { message: string } {
        switch (issue.code) {
            case "invalid_type": {
                const path     = makePath()
                const expected = issue.expected
                const received = issue.received
                const message  = `Configuration option "${path}" is of type "${received}" but it was expected to be of type "${expected}"`

                return { message }
            }

            case "too_small": {
                const path    = makePath()
                const sign    = issue.inclusive ? "≥" : ">"
                const message = `Configuration option "${path}" is too small. Expected to be ${sign} ${issue.minimum}`

                return { message }
            }

            case "too_big": {
                const path    = makePath()
                const sign    = issue.inclusive ? "≤" : "<"
                const message = `Configuration option "${path}" is too big. Expected to be ${sign} ${issue.maximum}`

                return { message }
            }

            case "unrecognized_keys": {
                const path     = makePath()
                const keyPaths = issue.keys.map(key => `${path}.${key}`)
                const message  = `Configuration contains the following unrecognized options: ${keyPaths.join(", ")}`

                return { message }
            }

            case "invalid_string": {
                const path    = makePath()
                const message = `Configuration option "${path}" is of invalid format`

                return { message }
            }
        }

        return { message: ctx.defaultError + "(" + issue.code + ")" };

        function makePath() {
            return issue.path.join(".")
        }
    }

    private static zodErrorToErrorList(error: z.ZodError): ErrorList {
        return new ErrorList(error.issues.map(issue => new Error(issue.message)))
    }

    private static validateParsedJsonMysqlCredentials(config: ConfigJson) {
        const noLogin         = config.mysql?.login           == null
        const noPassword      = config.mysql?.password        == null
        const noInitLogin     = config.mysql?.init?.login     == null
        const noInitPassword  = config.mysql?.init?.password  == null
        const noServeLogin    = config.mysql?.serve?.login    == null
        const noServePassword = config.mysql?.serve?.password == null
        const noGeneral       = noLogin      || noPassword
        const noInit          = noInitLogin  || noInitPassword
        const noServe         = noServeLogin || noServePassword
        const noSpecial       = noInit       || noServe

        if (noGeneral && noSpecial) {
            if (noLogin && noPassword)
                throw new Error('Missing "mysql.login" and "mysql.password" configuration options')

            if (noLogin)
                throw new Error('Missing "mysql.login" configuration option')

            throw new Error('Missing "mysql.password" configuration option')
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
        const prefix = api?.apiPrefix ?? Config.DEFAULT_HTTP_API_PREFIX

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
        return this.read.http?.apiPrefix ?? Config.DEFAULT_HTTP_API_PREFIX
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

    get logicMaxNicknames(): number {
        return this.read.logic?.maxNicknames ?? Config.DEFAULT_LOGIC_MAX_NICKNAMES
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

    get logicOpenBrowser(): boolean {
        return this.read.logic?.openBrowser ?? Config.DEFAULT_LOGIC_OPEN_BROWSER
    }

    get rconHost(): string {
        return this.read.rcon?.host ?? Config.DEFAULT_RCON_HOST
    }

    get rconPort(): number {
        return this.read.rcon?.port ?? Config.DEFAULT_RCON_PORT
    }

    get rconAvailable(): boolean {
        return this.read.rcon?.password != null
    }

    get mcHost(): string {
        return this.read.mc?.host ?? Config.DEFAULT_MC_HOST
    }

    get mcPort(): number {
        return this.read.mc?.port ?? Config.DEFAULT_MC_PORT
    }

    get mcStatusLifetime(): number {
        return this.read.mc?.statusLifetime ?? Config.DEFAULT_MC_STATUS_LIFETIME
    }
}