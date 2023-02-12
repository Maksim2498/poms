import { promises as fsp } from "fs"
import mysql               from "mysql"

export interface Config {
    mysql: {
        database?: string
        host?:     string
        port?:     number
        user:      string
        password:  string
    }

    api?: {
        prefix?:     string
        host?:       string
        port?:       number
        socketPath?: string
    }
}

export const DEFAULT_API_HOST   = "localhost"
export const DEFAULT_API_PORT   = 8000
export const DEFAULT_API_PREFIX = "api"

export function configToURL(config: Config): string {
    const host   = config.api?.host       ?? DEFAULT_API_HOST
    const port   = config.api?.socketPath ?  "" : `:${config.api?.port ?? DEFAULT_API_PORT}`
    const prefix = config.api?.prefix     ?? DEFAULT_API_PREFIX

    return `http://${host}${port}/${prefix}/`
}

export const DEFAULT_MYSQL_DATABASE = "poms"
export const DEFAULT_MYSQL_HOST     = "localhost"
export const DEFAULT_MYSQL_PORT     = 3306

export function configToDBConnection(config: Config): mysql.Connection {
    return mysql.createConnection({
        host:     config.mysql.host ?? DEFAULT_MYSQL_HOST,
        port:     config.mysql.port ?? DEFAULT_MYSQL_PORT,
        user:     config.mysql.user,
        password: config.mysql.password
    })
}

export async function readConfig(paths: string[] = ["config.json"]): Promise<Config> {
    const json = await readMergedJSONs(paths)
    checkConfig(json)
    return json
}

async function readMergedJSONs(paths: string[]): Promise<any> {
    const merged = {}

    for (const path of paths)
        assignDeep(merged, await readJSON(path))

    return merged
}

async function readJSON(path: string): Promise<any> {
    try {
        const buffer = await fsp.readFile(path)
        const string = buffer.toString();

        return JSON.parse(string)
    } catch (error) {
        if (error instanceof SyntaxError)
            throw new Error(`Configuration file ${path} is malformed`)

        if (error instanceof Error && (error as any).code === "ENOENT")
            throw new Error(`Configuration file ${path} not found`)

        throw new Error(`Failed to read ${path}`)
    }
}

function assignDeep(to: any, from: any): any {
    for (const field in from) 
        if (typeof to[field] === "object" && typeof from[field] === "object")
            assignDeep(to[field], from[field])
        else
            to[field] = from[field]

    return to
}

interface Field {
    path:      string
    type:      string
    required?: boolean
}

function checkConfig(json: any): json is Config {
    const fields = [
        {
            path: "mysql.database",
            type: "string"
        },
        { 
            path: "mysql.host",
            type: "string"
        },
        { 
            path: "mysql.port", 
            type: "number"
        },
        { 
            path:     "mysql.user", 
            type:     "string",
            required: true
        },
        { 
            path:     "mysql.password", 
            type:     "string",
            required: true
        },
        { 
            path: "api.prefix", 
            type: "string",
        },
        { 
            path: "api.host", 
            type: "string"
        },
        { 
            path: "api.port", 
            type: "number"
        },
        { 
            path: "api.socketPath", 
            type: "string"
        },
    ]

    checkAllowedConfigFields(json, fields.map(field => field.path))

    for (const field of fields)
        checkConfigFields(json, field)

    checkConfigPortField(json, "api.port")
    checkConfigPortField(json, "mysql.port")

    return true
}

function checkAllowedConfigFields(object: any, paths: string[]) {
    const objectPaths = objectToPaths(object)

    for (const objectPath of objectPaths)
        if (!paths.includes(objectPath))
            throw new Error(`Configuration field ${objectPath} is excess`)
}

function objectToPaths(object: any): string[] {
    const paths: string[] = []

    for (const field in object) {
        if (typeof object[field] !== "object") {
            paths.push(field)
            continue
        }

        const subPaths = objectToPaths(object[field]).map(subPath => `${field}.${subPath}`)

        if (subPaths.length === 0)
            paths.push(field)
        else
            for (const subPath of subPaths)
                paths.push(subPath)
    }

    return paths
}

function checkConfigFields(object: any, field: Field) {
    const value = getFieldValue(object, field.path)

    if (value == null) {
        if (field.required ?? false)
            throw new Error(`Missing configuration field ${field.path}`) 

        return
    }

    if (typeof value !== field.type)
        throw new Error(`Configuraiton field ${field.path} must be of type ${field.type}`)
}

function checkConfigPortField(object: any, path: string, required: boolean = false) {
    const port = getFieldValue(object, path)

    if (port == null && !required)
        return

    if (!Number.isInteger(port) || port < 0 || port > 65535)
        throw new Error(`Configuration field ${path} should be an integer is range [0, 65535]`)
}

function getFieldValue(object: any, path: string): any {
    if (object == null)
        return undefined

    const subPaths = path.split(".")
    let   value    = object

    for (const subPath of subPaths) {
        value = value[subPath]

        if (value == null)
            return undefined
    }

    return value
}