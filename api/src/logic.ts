import { Connection } from "mysql"
import { Logger     } from "winston"

import * as am from "./util/mysql/async"
import * as e  from "./util/error"

export const DEFAULT_ADMIN_LOGIN    = "admin"
export const DEFAULT_ADMIN_PASSWORD = "admin"

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

    const info = await getUserInfo({ login, logger, connection })

    if (info == null) {
        logger?.info(`There is no user "${login}"`)

        await createUser({
            connection,
            logger,
            login,
            password,
            isAdmin:  true
         })
    } else {
        logger?.info(`User "${login}" already exists`)

        if (!info.isAdmin)
            logger?.warn(`User "${login}" doesn\'t have admin rights`)
    }
    return false
}

export interface CreateUserOptions {
    connection: Connection
    logger?:    Logger
    login:      string
    password:   string
    name?:      string
    isAdmin?:   boolean
}

export async function createUser(options: CreateUserOptions): Promise<boolean> {
    const { connection, logger, password, name, isAdmin } = options
    const login                                           = normalizeLogin(options.login)

    logger?.info(`Creaing user "${login}"...`)

    if (!isLoginValid(login))
        throw e.fromMessage(`Login "${login}" is invalid`, logger)

    const created = await am.query({
        connection,
        logger,
        sql:       'INSERT INTO Users (login, name, password_hash, is_admin) VALUES (?, ?, UNHEX(SHA2(?, 512)), ?)',
        values:    [login, name, `${login}:${password}`, isAdmin],
        onError:   () => false,
        onSuccess: () => true
    })

    logger?.info("Created")

    return created
}

export interface DeleteUserOptions {
    connection: Connection
    logger?:    Logger
    login:      string
}

export async function deleteUser(options: DeleteUserOptions) {
    // TODO
}

export interface GetUserInfoOptions {
    connection: Connection
    logger?:    Logger
    login:      string
}

export interface UserInfo {
    id:           number
    login:        string
    name?:        string
    passwordHash: Buffer
    isAdmin:      boolean
}

export async function getUserInfo(options: GetUserInfoOptions): Promise<UserInfo | undefined> {
    let { connection, logger, login } = options

    login = normalizeLogin(login)

    return await am.query({
        connection,
        logger,
        sql:       "SELECT * FROM Users WHERE login = ?",
        values:    [login],
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