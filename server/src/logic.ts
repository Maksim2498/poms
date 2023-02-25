import AsyncConnection from "util/mysql/AsyncConnection"
import LoggedError     from "./util/LoggedError"

import { ReadonlyTable, expr                        } from "util/mysql/Table"
import { USERS_TABLE, NICKNAMES_TABLE, TOKENS_TABLE } from "./db-schema"
import { Logger                                     } from "winston"

export const DEFAULT_ADMIN_LOGIN    = "admin"
export const DEFAULT_ADMIN_PASSWORD = "admin"

export type User = string | number

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

    validateLogin(login, connection.logger)

    let creatorId: number | undefined

    if (creator != null) {
        const creatorInfo = await forceGetUserInfo(connection, creator)

        if (!creatorInfo.isAdmin)
            throw LoggedError.fromMessage(
                `Only admin can be a creator of another user. "${creatorInfo.name}" isn't an admin`,
                connection.logger
            )

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

export async function deleteAllTokens(connection: AsyncConnection, user?: User) {
    await deleteAllTokensOrNicknames(connection, TOKENS_TABLE, user)
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
            validateLogin(user)
            await USERS_TABLE.delete(connection).where("login = ?", user)
            break

        case "number":
            connection.logger?.info(`Deleting user with id ${user}...`)
            await USERS_TABLE.delete(connection).where("id = ?", user)
    }

    connection.logger?.info("Deleted")
}

export async function getValidUserId(connection: AsyncConnection, user: User): Promise<number> {
    return (await forceGetUserInfo(connection, user)).id
}

export async function getUserId(conneciton: AsyncConnection, user: User): Promise<number> {
    return typeof user === "string" ? (await forceGetUserInfo(conneciton, user)).id
                                    : user
}

export async function forceGetUserInfo(connection: AsyncConnection, user: User): Promise<UserInfo> {
    const info = await getUserInfo(connection, user)

    if (info == null) {
        const message = typeof user === "string" ? `There is no user "${user}"`
                                                 : `There is no user with id ${user}`

        throw LoggedError.fromMessage(message, connection.logger)
    }

    return info
}

export interface UserInfo {
    id:           number
    login:        string
    name?:        string
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
}

export async function getUserInfo(connection: AsyncConnection, user: User): Promise<UserInfo | undefined> {
    let where: string

    switch (typeof user) {
        case "string":
            validateLogin(user, connection.logger)
            where = "login = ?"
            break

        case "number":
            where = "id = ?"
    }

    const results = await USERS_TABLE.select(connection).where(where, user)

    if (!results.length)
        return undefined

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

function validateLogin(login: string, logger?: Logger) {
    if (!isLoginValid(login))
        throw LoggedError.fromMessage(`Login "${login}" is invalid`, logger)
}

export function isLoginValid(login: string): boolean {
    return login.length >= 4
        && !login.match(/\s/)
}