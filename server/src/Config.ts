import bytes                        from "bytes"
import z                            from "zod"
import parseDuration                from "parse-duration"
import template                     from "string-placeholder"
import DeepReadonly                 from "util/DeepReadonly"
import ErrorList                    from "util/ErrorList"

import { promises as fsp          } from "fs"
import { normalize, join, dirname } from "path"
import { Logger                   } from "winston"

const PORT     = z.number().int().nonnegative().max(65535)
const STRING   = z.string()
const NSTRING  = STRING.nullable().default(null)
const HOST     = z.string().transform(s => s.trim())
const NHOST    = HOST.nullable().default(null)
const URI_PATH = z.string().transform(s => normalize("/" + s))
const PATH     = z.string().transform(s => Config.placehold(normalize(s)))
const NPATH    = PATH.nullable().default(null)
const BOOLEAN  = z.boolean().default(false)
const UINT      = z.number().int().nonnegative()

const SAME_AS_MC_HOST = Symbol()

const RCON_HOST = z.custom<string>(value => {
    if (typeof value === "string")
        return value.trim()

    return value
}).superRefine((value, ctx) => {
    if (value as any === SAME_AS_MC_HOST)
        return

    const type = typeof value

    if (type === "string")
        return

    ctx.addIssue({
        code:     "invalid_type",
        expected: "string",
        received: type
    })
}).default(SAME_AS_MC_HOST as any)

const DB_NAME = z.string().superRefine((value, ctx) => {
    if (value.match(/^[0-9,a-z,A-Z$_]+$/) == null) {
        const path    = ctx.path.join(".")
        const message = `Configuration option "${path}" is an invalid database identifier`

        ctx.addIssue({ code: "custom", message })
    }
})

const DUR = z.string().transform((value, ctx) => {
    const parsed = parseDuration(value)

    if (parsed == null) {
        const path    = ctx.path.join(".")
        const message = `Configuration option "${path}" is an invalid duration`

        ctx.addIssue({ code: "custom", message })

        return z.NEVER
    }

    return parsed
})

const SIZE = z.string().transform((value, ctx) => {
    const parsed = bytes(value)

    if (parsed == null) {
        const path    = ctx.path.join(".")
        const message = `Configuration option "${path}" is an invalid size`

        ctx.addIssue({ code: "custom", message })

        return z.NEVER
    }

    return parsed
})

export type ConfigJson         = z.infer<typeof Config.JSON_SCHEMA>
export type ReadonlyConfigJson = DeepReadonly<ConfigJson>

export default class Config {
    static readonly JSON_SCHEMA = z.object({
        http: z.object({
            proxied:              BOOLEAN,
            apiPrefix:            URI_PATH.default("/api"),
            maxBodySize:          SIZE.default("22mb"),
            host:                 NHOST,
            port:                 PORT.default(8000),
            socketPath:           NPATH,
            serveStatic:          BOOLEAN.default(true),
            staticPath:           PATH.default("<SITE_PATH>/build"),
            error:                z.object({
                "404Path":        PATH.default("<SITE_PATH>/build/404.html"),
                "500Path":        PATH.default("<SITE_PATH>/build/500.html"),
            }).strict().default({}),
        }).strict().default({}),

        ws: z.object({
            prefix:               URI_PATH.default("/ws"),
        }).strict().default({}),

        mysql: z.object({
            database:             DB_NAME.default("poms"),
            host:                 HOST.default("localhost"),
            port:                 PORT.default(3306),
            socketPath:           NPATH,
            login:                NSTRING,
            password:             NSTRING,
            connectionLimit:      UINT.default(10),

            init: z.object({
                login:            NSTRING,
                password:         NSTRING,
            }).strict().default({}),

            serve: z.object({
                login:            NSTRING,
                password:         NSTRING,
            }).strict().default({}),
        }).strict().default({}),

        logic: z.object({
            admin: z.object({
                create:           BOOLEAN.default(true),
                login:            STRING.default("admin"),
                password:         STRING.default("admin"),
                name:             NSTRING.default("Administrator"),
            }).strict().default({}),

            static: z.object({
                build:            BOOLEAN.default(true),
                buildPath:        PATH.default("<SITE_PATH>"),
                forceBuild:       BOOLEAN,
            }).strict().default({}),

            maxTokens:            UINT.default(10),
            maxNicknames:         UINT.default(5),
            openBrowser:          BOOLEAN.default(true),
            aTokenLifetime:       DUR.default("30m"),
            rTokenLifetime:       DUR.default("1w"),
            allowAnonymousAccess: BOOLEAN.default(true),
            authDelay:            DUR.default("2s"),
            noAuthDelayInDev:     BOOLEAN.default(true),
        }).strict().default({}),

        rcon: z.object({
            enable:               BOOLEAN,
            host:                 RCON_HOST,
            port:                 PORT.default(25575),
            password:             NSTRING,
        }).strict().default({}),

        mc: z.object({
            publicAddress:        NHOST,
            host:                 HOST.default("localhost"),
            port:                 PORT.default(25565),
            statusLifetime:       DUR.default("10s"),
        }).strict().default({}),
    })

    static readonly POMS_PATH   = dirname(dirname(__dirname)) // this file is in /server/src/
    static readonly PLUGIN_PATH = join(this.POMS_PATH, "plugin")
    static readonly SERVER_PATH = join(this.POMS_PATH, "server")
    static readonly SITE_PATH   = join(this.POMS_PATH, "site")

    static placehold(path: string): string {
        return template(path, {
            POMS_PATH:   this.POMS_PATH,
            PLUGIN_PATH: this.PLUGIN_PATH,
            SERVER_PATH: this.SERVER_PATH,
            SITE_PATH:   this.SITE_PATH
        }, {
            before: "<",
            after:  ">"
        })
    }

    static async readFromFile(path?: string, logger?: Logger): Promise<Config> {
        if (path == null)
            path = await this.findConfig(logger)

        logger?.info("Reading config...")

        const json   = await this.readJson(path)
        const config = new Config(json, path)

        logger?.info("Done")

        return config
    }

    static readonly FILE_NAME = "poms-config.json"

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
            const string = await fsp.readFile(path, "utf-8")

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

    readonly read: ReadonlyConfigJson
    readonly path: string

    constructor(json: any, path?: string) {
        const parsedJson = Config.JSON_SCHEMA.safeParse(json, { errorMap: Config.zodErrorMap })

        if (!parsedJson.success)
            throw Config.zodErrorToErrorList(parsedJson.error)

        Config.validateParsedJsonMysqlCredentials(parsedJson.data)

        if (parsedJson.data.rcon.host as any === SAME_AS_MC_HOST)
            parsedJson.data.rcon.host = parsedJson.data.mc.host
        
        this.read = parsedJson.data
        this.path = path ?? Config.FILE_NAME
    }

    private static zodErrorMap(issue: z.ZodIssueOptionalMessage, ctx: { defaultError: string, data: any }): { message: string } {
        switch (issue.code) {
            case "invalid_type": {
                const path     = makePath()
                const expected = issue.expected
                const received = issue.received
                const message  = received !== "undefined" ? `Configuration option "${path}" is of type "${received}" but it was expected to be of type "${expected}"`
                                                          : `Configuration option "${path}" is missing`

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

    private static validateParsedJsonMysqlCredentials(config: ReadonlyConfigJson) {
        const noLogin         = config.mysql.login          == null
        const noPassword      = config.mysql.password       == null
        const noInitLogin     = config.mysql.init.login     == null
        const noInitPassword  = config.mysql.init.password  == null
        const noServeLogin    = config.mysql.serve.login    == null
        const noServePassword = config.mysql.serve.password == null
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

    get httpApiAddress(): string {
        const address = this.httpAddress.slice(0, -1) // Removes trailing "/"
        const path    = this.read.http.apiPrefix

        return `${address}${path}/`
    }

    get httpAddress(): string {
        const socketPath = this.read.http.socketPath

        if (socketPath != null)
            return `http://unix:${socketPath}/`

        const host = this.read.http.host ?? "localhost"
        const port = this.read.http.port

        return `http://${host}:${port}/`
    }

    get mysqlAddress(): string {
        const socketPath = this.read.mysql.socketPath

        if (socketPath != null)
            return `unix:${socketPath}`

        const port = this.read.mysql.port
        const host = this.read.mysql.host

        return `${host}:${port}`
    }

    get useMysqlInitUser(): boolean {
        return this.read.mysql.init.login    != null
            && this.read.mysql.init.password != null
    }

    get useMysqlServeUser(): boolean {
        return this.read.mysql.serve.login    != null
            && this.read.mysql.serve.password != null
    }

    get useAuthDelay(): boolean {
        return  process.env.NODE_ENV === "production"
            || !this.read.logic.noAuthDelayInDev
    }

    get rconAddress(): string {
        const host = this.read.rcon.host
        const port = this.read.rcon.port

        return `${host}:${port}`
    }

    get isRconAvailable(): boolean {
        return this.read.rcon.enable
            && this.read.rcon.password != null
    }

    get mcAddress(): string {
        const host = this.read.mc.host
        const port = this.read.mc.port

        return `${host}:${port}`
    }

    toString(): string {
        return JSON.stringify(this.read, null, 4)
    }
}