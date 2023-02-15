import { Connection } from "mysql"
import { Logger     } from "winston"
import * as am        from "./util/mysql/async"

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

    if (!isLoginValid(login))
        throw new Error(`Login "${login}" is invalid`)

    return await am.query({
        connection,
        logger,
        sql:       'INSERT INTO Users (login, name, password_hash, is_admin) VALUES (?, ?, UNHEX(SHA2(?, 512)), ?)',
        values:    [login, name, `${login}:${password}`, isAdmin],
        onError:   () => false,
        onSuccess: () => true
    })
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