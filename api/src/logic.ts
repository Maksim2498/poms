import { Connection } from "mysql"
import { Logger     } from "winston"
import * as am        from "./async_mysql"

export interface CreateUserOptions {
    connection: Connection
    logger?:    Logger
    login:      string
    password:   string
    name?:      string
    isAdmin?:   boolean
}

export async function createUser(options: CreateUserOptions) {

}

export interface DeleteUserOptions {
    connection: Connection
    logger?:    Logger
    login:      string
}

export async function deleteUser(options: DeleteUserOptions) {

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
    const { connection, logger, login } = options

    return await am.query({
        connection,
        logger,
        sql:       "SELECT * FROM Users WHERE login = ?",
        values:    [login],
        onSuccess: results => {
            if (!results.length)
                return

            let { id, login, name, password_hash: passwordHash, is_admin: isAdmin } = results[0]

            isAdmin = !!isAdmin

            return { id, login, name, passwordHash, isAdmin } as UserInfo
        }
    })
}