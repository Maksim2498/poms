import { Connection, MysqlError } from "mysql"
import { Logger                 } from "winston"

import * as am from "./util/mysql/async"
import * as s  from "./util/mysql/statement"
import * as e  from "./util/error"

export const DEFAULT_ADMIN_LOGIN    = "admin"
export const DEFAULT_ADMIN_PASSWORD = "admin"

export type User = string | number

export interface CreateAdminOptions {
    connection: Connection
    logger?:    Logger
    login?:     string
    password?:  string
}

export async function createAdmin(options: CreateAdminOptions): Promise<boolean> {
    const { logger, connection } = options
    const login                  = options.login    ?? DEFAULT_ADMIN_LOGIN
    const password               = options.password ?? DEFAULT_ADMIN_PASSWORD

    logger?.info(`Trying creating administrator "${login}"...`)
    logger?.info(`Checking if user "${login}" exists...`)

    const info = await getUserInfo({ user: login, logger, connection })

    if (info == null) {
        logger?.info(`There is no user "${login}"`)

        return await createUser({
            connection,
            logger,
            login,
            password,
            isAdmin: true
         })
    } else {
        logger?.info(`User "${login}" already exists`)

        if (!info.isAdmin)
            logger?.warn(`User "${login}" doesn\'t have admin rights`)

        return false
    }
}

export interface CreateUserOptions {
    connection: Connection
    logger?:    Logger
    login:      string
    password:   string
    name?:      string
    isAdmin?:   boolean
    creator?:   User
} 

export async function createUser(options: CreateUserOptions): Promise<boolean> {
    const { connection, logger, password, name, isAdmin, creator } = options
    const login                                                    = normalizeLogin(options.login)

    logger?.info(`Creaing user "${login}"...`)

    if (!isLoginValid(login))
        throw e.fromMessage(`Login "${login}" is invalid`, logger)

    let creatorId: number | undefined

    switch (typeof creator) {
        case "string":
            if (!isLoginValid(creator))
                throw e.fromMessage(`Creator login "${creator}" is invalid`, logger)

            const creatorInfo = await getUserInfo({ connection, logger, user: creator })

            if (!creatorInfo)
                throw e.fromMessage(`Cannot find creator. There is no user "${creator}"`)

            if (!creatorInfo.isAdmin)
                throw e.fromMessage(`Only admin can be a creator of another user. "${creator}" isn't an admin`)

            creatorId = creatorInfo.id

            break

        case "number":
            creatorId = creator
    }

    const created = await am.query({
        connection,
        logger,
        sql:       'INSERT INTO Users (login, name, cr_id, password_hash, is_admin) VALUES (?, ?, ?, UNHEX(SHA2(?, 512)), ?)',
        values:    [login, name, creatorId, `${login}:${password}`, isAdmin],
        onError:   (error: MysqlError) => error.code === "ER_DUP_ENTRY" ? false : undefined,
        onSuccess: () => true
    })

    logger?.info(created ? "Created" : "Already exists")

    return created
}

export interface DeleteAllUsersOptions {
    connection: Connection
    logger?:    Logger
}

export async function deleteAllUser(options: DeleteAllUsersOptions) {
    await s.clearTable({ name: "Users", ...options })
}

export interface DeleteAllCNamesOptions {
    connection: Connection
    logger?:    Logger
    user?:      User
}

export async function deleteAllCNames(options: DeleteAllCNamesOptions): Promise<boolean> {
    const { user } = options

    if (user == null) {
        await s.clearTable({ name: "CNames", ...options })
        return true
    }

    const { connection, logger } = options

    let id

    switch (typeof user) {
        case "string":
            logger?.info(`Deleting all canonical names of user "${user}"...`)

            if (!isLoginValid(user))
                throw e.fromMessage(`User login "${user}" is invalid`, logger)

            const info = await getUserInfo({ connection, logger, user })

            if (!info)
                throw e.fromMessage(`There is no user "${user}"`)

            id = info.id

            break

        case "number":
            logger?.info(`Deleting all canonical names of user with id "${user}"...`)
            id = user
    }

    const deleted = await am.query({
        connection,
        logger,
        sql:    "DELETE FROM CNames WHERE user_id = ?",
        values: [id],
        onSuccess: (results: any[]) => results.length != 0
    })

    logger?.info(deleted ? "Deleted" : "Canonical names not found")

    return deleted

}

export interface DeleteAllTokensOptions {
    connection: Connection
    logger?:    Logger
    user?:      User
}

export async function deleteAllTokens(options: DeleteAllTokensOptions): Promise<boolean> {
    const { user } = options

    if (user == null) {
        await s.clearTable({ name: "Tokens", ...options })
        return true
    }

    const { connection, logger } = options

    let id

    switch (typeof user) {
        case "string":
            logger?.info(`Deleting all tokens of user "${user}"...`)

            if (!isLoginValid(user))
                throw e.fromMessage(`User login "${user}" is invalid`, logger)

            const info = await getUserInfo({ connection, logger, user })

            if (!info)
                throw e.fromMessage(`There is no user "${user}"`)

            id = info.id

            break

        case "number":
            logger?.info(`Deleting all tokens of user with id "${user}"...`)
            id = user
    }

    const deleted = await am.query({
        connection,
        logger,
        sql:    "DELETE FROM Tokens WHERE user_id = ?",
        values: [id],
        onSuccess: (results: any[]) => results.length != 0
    })

    logger?.info(deleted ? "Deleted" : "Tokens not found")

    return deleted
}

export type DeleteUserOptions = {
    connection: Connection
    logger?:    Logger
    login:      string
} | {
    conneciton: Connection
    logger?:    Logger
    id:         number
}

export async function deleteUser(options: DeleteUserOptions) {
    // TODO
}

export interface GetUserInfoOptions {
    connection: Connection
    logger?:    Logger
    user:       User
} 

export interface UserInfo {
    id:           number
    login:        string
    name?:        string
    passwordHash: Buffer
    isAdmin:      boolean
}

export async function getUserInfo(options: GetUserInfoOptions): Promise<UserInfo | undefined> {
    const { connection, logger, user } = options

    return await am.query({
        connection,
        logger,
        sql: typeof user === "string" ? "SELECT * FROM Users WHERE login = ?" 
                                      : "SELECT * FROM Users WHERE id = ?",
        values: [user],
        onSuccess: (results: any[]) => {
            if (!results.length)
                return

            let { id, login, name, password_hash: passwordHash, is_admin: isAdmin } = results[0]

            isAdmin = !!isAdmin

            return { id, login, name, passwordHash, isAdmin } as UserInfo
        }
    })
}

export function normalizeLogin(login: string) {
    return login.trim()
}

export function isLoginValid(login: string): boolean {
    return login.length >= 4;
}