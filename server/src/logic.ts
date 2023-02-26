import crypto          from "crypto"
import AsyncConnection from "util/mysql/AsyncConnection"

import { ReadonlyTable, expr                        } from "util/mysql/Table"
import { USERS_TABLE, NICKNAMES_TABLE, A_TOKENS_TABLE, R_TOKENS_TABLE } from "./db-schema"

export const DEFAULT_ADMIN_LOGIN    = "admin"
export const DEFAULT_ADMIN_PASSWORD = "admin"

export type User = string | number

export interface AuthOptions {
    accessLifeTime?:  number
    refreshLifeTime?: number
}

export const DEFAULT_AUTH_OPTIONS: AuthOptions = {
    accessLifeTime:  30 * 60,
    refreshLifeTime: 7 * 24 * 60 * 60 // Weak
}

export interface TokenPair {
    id:      Token
    refresh: Token
}

export interface Token {
    id:   Buffer
    exp?: Date
}

export async function auth(connection: AsyncConnection, login: string, password: string, options: AuthOptions = DEFAULT_AUTH_OPTIONS): Promise<TokenPair> {
    const user_id    = await getUserIdByCredentials(connection, login, password)
    const accessId   = generateId()
    const accessExp  = dateSecondsAhead(options.accessLifeTime)
    const refreshId  = generateId()
    const refreshExp = dateSecondsAhead(options.refreshLifeTime)

    await A_TOKENS_TABLE.insert(connection, {
        id:       accessId,
        exp_time: accessExp,
        user_id
    })

    await R_TOKENS_TABLE.insert(connection, {
        id:        refreshId,
        access_id: accessId,
        exp_time:  refreshExp
    })

    return {
        id: {
            id:  accessId,
            exp: accessExp
        },

        refresh: {
            id:  refreshId,
            exp: refreshExp
        }
    }

    function generateId() {
        const id = crypto.randomBytes(64)
        id.writeUInt32BE(Date.now() / 1000, id.length - 4)
        return id
    }

    function dateSecondsAhead(seconds?: number) {
        if (seconds == null)
            return undefined

        const date = new Date()

        date.setSeconds(date.getSeconds() + seconds)

        return date
    }
}

export interface TokenPairJson {
    access:  TokenJson
    refresh: TokenJson
}

export function tokenPairToJson(tokenPair: TokenPair): TokenPairJson {
    return {
        access:  tokenToJson(tokenPair.id),
        refresh: tokenToJson(tokenPair.refresh)
    }
}

export interface TokenJson {
    id:   string
    exp?: string
}

export function tokenToJson(token: Token): TokenJson {
    return {
        id:  token.id.toString("hex"),
        exp: token.exp?.toISOString()
    }
}

export async function getUserIdByCredentials(connection: AsyncConnection, login: string, password: string): Promise<number> {
    checkLogin(login)
    checkPassword(password)

    const results = await USERS_TABLE.select(connection, "id")
                                     .where(
                                         "login = ? and password_hash = UNHEX(SHA2(?, 512))",
                                         login,
                                         `${login}:${password}`
                                     )

    if (results.length === 0)
        throw new LogicError("Invalid login or password")

    return results[0].id
}

export interface CreateAdminOptions {
    connection: AsyncConnection
    login?:     string
    password?:  string
}

export async function createAdmin(options: CreateAdminOptions): Promise<boolean> {
    const connection = options.connection
    const login      = options.login    ?? DEFAULT_ADMIN_LOGIN
    const password   = options.password ?? DEFAULT_ADMIN_PASSWORD

    connection.logger?.info(`Trying too create administrator "${login}"...`)
    connection.logger?.info(`Checking if user "${login}" exists...`)

    const info = await getUserInfo(connection, login)

    if (info == null) {
        connection.logger?.info(`There is no user "${login}"`)

        return await createUser({
            connection,
            login,
            password,
            isAdmin: true
         })
    } else {
        connection.logger?.info(`User "${login}" already exists`)

        if (!info.isAdmin)
            connection.logger?.warn(`User "${login}" doesn\'t have admin rights`)

        return false
    }
}

export interface CreateUserOptions {
    connection: AsyncConnection
    login:      string
    password:   string
    name?:      string
    isAdmin?:   boolean
    creator?:   User
} 

export async function createUser(options: CreateUserOptions): Promise<boolean> {
    const { connection, login, password, name, isAdmin, creator } = options

    connection.logger?.info(`Creaing user "${login}"...`)

    checkLogin(login)

    let creatorId: number | undefined

    if (creator != null) {
        const creatorInfo = await getUserInfo(connection, creator, true)

        if (!creatorInfo.isAdmin)
            throw new LogicError(`Only admin can be a creator of another user. "${creatorInfo.name}" isn't an admin`)

        creatorId = creatorInfo.id
    }

    const created = await USERS_TABLE.insert(connection, {
        login,
        name,
        cr_id:         creatorId,
        password_hash: expr("UNHEX(SHA2(?, 512))", `${login}:${password}`),
        is_admin:      isAdmin
    })

    connection.logger?.info(created ? "Created" : "Already exists")

    return created
}

export async function deleteAllUser(connection: AsyncConnection) {
    await USERS_TABLE.clear(connection)
}

export async function deleteAllNicknames(connection: AsyncConnection, user?: User) {
    await deleteAllTokensOrNicknames(connection, NICKNAMES_TABLE, user)
}

export async function deleteAllATokens(connection: AsyncConnection, user?: User) {
    await deleteAllTokensOrNicknames(connection, A_TOKENS_TABLE, user)
}

export async function deleteAllRTokens(connection: AsyncConnection, user?: User) {
    await deleteAllTokensOrNicknames(connection, R_TOKENS_TABLE, user)
}

async function deleteAllTokensOrNicknames(connection: AsyncConnection, table: ReadonlyTable, user?: User) {
    if (user == null) {
        await table.clear(connection)
        return
    }

    connection.logger?.info(typeof user === "string" ? `Deleting all ${table.name} of user "${user}"...`
                                                     : `Deleting all ${table.name} of user with id "${user}"...`)

    await table.delete(connection).where("user_id = ?", await getUserId(connection, user))

    connection.logger?.info("Deleted")
}

export async function deleteUser(connection: AsyncConnection, user: User) {
    switch (typeof user) {
        case "string":
            connection.logger?.info(`Deleting user "${user}"...`)
            checkLogin(user)
            await USERS_TABLE.delete(connection).where("login = ?", user)
            break

        case "number":
            connection.logger?.info(`Deleting user with id ${user}...`)
            await USERS_TABLE.delete(connection).where("id = ?", user)
    }

    connection.logger?.info("Deleted")
}

export async function getValidUserId(connection: AsyncConnection, user: User): Promise<number> {
    return (await getUserInfo(connection, user, true)).id
}

export async function getUserId(conneciton: AsyncConnection, user: User): Promise<number> {
    return typeof user === "string" ? (await getUserInfo(conneciton, user, true)).id
                                    : user
}

export interface UserInfo {
    id:           number
    login:        string
    name?:        string
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
}

export async function getUserInfo(connection: AsyncConnection, user: User, force: true): Promise<UserInfo>
export async function getUserInfo(connection: AsyncConnection, user: User, force?: false): Promise<UserInfo | undefined>
export async function getUserInfo(connection: AsyncConnection, user: User, force: boolean = false): Promise<UserInfo | undefined> {
    let where: string

    switch (typeof user) {
        case "string":
            checkLogin(user)
            where = "login = ?"
            break

        case "number":
            where = "id = ?"
    }

    const results = await USERS_TABLE.select(connection).where(where, user)

    if (!results.length) {
        if (force)
            throw new LogicError(typeof user === "string" ? `There is no user "${user}"`
                                                          : `There is no user with id ${user}`)
        
        return undefined
    }

    const { id, login, name, password_hash, is_admin, is_online } = results[0]

    return {
        id,
        login,
        name,
        passwordHash: password_hash,
        isAdmin:      !!is_admin,
        isOnline:     !!is_online
    } as UserInfo
}

export function checkPassword(password: string) {
    const invalidReason = validatePassword(password)

    if (invalidReason !== undefined)
        throw new LogicError(invalidReason)
}

export function validatePassword(password: string): string | undefined {
    const MIN_LENGTH = 4

    if (password.length < MIN_LENGTH)
        return `Password is too short. Minimum ${MIN_LENGTH} characters required`

    return undefined
}

export function checkLogin(login: string) {
    const invalidReason = validateLogin(login)

    if (invalidReason !== undefined)
        throw new LogicError(invalidReason)
}

export function validateLogin(login: string): string | undefined {
    const MIN_LENGTH = 4

    if (login.length < MIN_LENGTH)
        return `Login "${login}" is too short. Minimum ${MIN_LENGTH} characters required`

    if (login.match(/\s/))
        return `Login "${login}" contains whitespace`

    return undefined
}

export class LogicError extends Error {}