import AsyncConnection from "util/mysql/AsyncConnection"
import LogicError      from "./LogicError"

import { ReadonlyTable } from "util/mysql/Table"
import { expr          } from "util/mysql/Expression"
import { USERS_TABLE   } from "db-schema"

export type User = string | number

export const DEFAULT_ADMIN_LOGIN    = "admin"
export const DEFAULT_ADMIN_PASSWORD = "admin"
export const DEFAULT_ADMIN_NAME     = "Administartor"

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
            name:    DEFAULT_ADMIN_NAME,
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

export async function deleteAllUserData(connection: AsyncConnection, table: ReadonlyTable, user?: User, column?: string) {
    if (user == null) {
        await table.clear(connection)
        return
    }

    connection.logger?.info(typeof user === "string" ? `Deleting all ${table.name} of user "${user}"...`
                                                     : `Deleting all ${table.name} of user with id "${user}"...`)

    if (column === undefined)
        column = "user_id"

    const userId = await getUserId(connection, user)

    await table.delete(connection).where("?? = ?", column, userId)

    connection.logger?.info("Deleted")
}

export async function deleteAllUser(connection: AsyncConnection) {
    await USERS_TABLE.clear(connection)
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

export async function getUserLogin(connection: AsyncConnection, user: number, force: true): Promise<string>
export async function getUserLogin(connection: AsyncConnection, user: number, force?: boolean): Promise<string | undefined>
export async function getUserLogin(connection: AsyncConnection, user: number, force: boolean = false): Promise<string | undefined> {
    return (await getUserInfo(connection, user, force))?.login
}

export interface DeepUserInfo {
    id:           number
    login:        string
    name?:        string
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
    created:      Date
    creator?:     UserInfo
}

export async function getDeepUserInfo(connection: AsyncConnection, user: User, force: true): Promise<DeepUserInfo>
export async function getDeepUserInfo(connection: AsyncConnection, user: User, force?: boolean): Promise<DeepUserInfo | undefined>
export async function getDeepUserInfo(connection: AsyncConnection, user: User, force: boolean = false): Promise<DeepUserInfo | undefined> {
    let where: string

    switch (typeof user) {
        case "string":
            checkLogin(user)
            where = "target.login = ?"
            break

        case "number":
            where = "target.id = ?"
    }

    const results = await USERS_TABLE.join(connection, "target", USERS_TABLE, "creator", "this.cr_id = that.id")
                                     .where(where, user)

    if (!results.length) {
        if (force)
            throw new LogicError(typeof user === "string" ? `There is no user "${user}"`
                                                          : `There is no user with id ${user}`)
        
        return undefined
    }

    const { target: t, creator: c } = results[0]

    return {
        id:           t.id,
        login:        t.login,
        name:         t.name,
        passwordHash: t.password_hash,
        isAdmin:      !!t.is_admin,
        isOnline:     !!t.is_online,
        created:      t.cr_time,
        creator:      {
            id:           c.id,
            login:        c.login,
            name:         c.name,
            passwordHash: c.password_hash,
            isAdmin:      !!c.is_admin,
            isOnline:     !!c.is_online,
            created:      c.cr_time,
            creator:      c.cr_id
        }
    }
}

export interface UserInfo {
    id:           number
    login:        string
    name?:        string
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
    created:      Date
    creator?:     number
}

export async function getUserInfo(connection: AsyncConnection, user: User, force: true): Promise<UserInfo>
export async function getUserInfo(connection: AsyncConnection, user: User, force?: boolean): Promise<UserInfo | undefined>
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

    const { id, login, name, password_hash, is_admin, is_online, cr_time, cr_id } = results[0]

    return {
        id,
        login,
        name,
        passwordHash: password_hash,
        isAdmin:      !!is_admin,
        isOnline:     !!is_online,
        created:      cr_time,
        creator:      cr_id
    }
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

    const MAX_LENGTH = 255

    if (password.length > MAX_LENGTH)
        return `Password is too long. Maximum ${MAX_LENGTH} characters allowed`

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

    const MAX_LENGTH = 255

    if (login.length > MAX_LENGTH)
        return `Login is too long. Maximum ${MAX_LENGTH} characters allowed`

    if (login.match(/\s/))
        return `Login "${login}" contains whitespace`

    return undefined
}