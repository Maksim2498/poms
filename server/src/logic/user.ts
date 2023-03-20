import Config                                     from "Config"
import LogicError                                 from "./LogicError"

import { Connection, FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise"
import { Logger                                 } from "winston"

export interface CreationOptions {
    readonly config:  Config
    readonly logger?: Logger
}

export type User = string | number

export interface ForceCreateAdminOptions {
    login?:    string
    password?: string
    name?:     string
}

export interface CreateAdminOptions extends ForceCreateAdminOptions {
    force?: boolean
}

export interface ForceCreateUserOptions {
    login:      string
    password:   string
    name?:      string
    isAdmin?:   boolean
    creator?:   User
}

export interface CreateUserOptions extends ForceCreateUserOptions {
    force?: boolean
} 

export interface DeepUserInfo {
    id:           number
    login:        string
    name:         string | null
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
    created:      Date
    creatorInfo:  UserInfo | null
}

export interface UserInfo {
    id:           number
    login:        string
    name?:        string
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
    created:      Date
    creatorId?:   number
}

export interface UserManager {
    forceSetUserName(connection: Connection, user: User, name: string | null): Promise<void>

    setUserName(connection: Connection, user: User, name: string | null, force:  true):    Promise<true>
    setUserName(connection: Connection, user: User, name: string | null, force?: boolean): Promise<boolean>

    forceSetUserPassword(connection: Connection, user: User, password: string): Promise<void>

    setUserPassword(connection: Connection, user: User, password: string, force:  true):    Promise<true>
    setUserPassword(connection: Connection, user: User, password: string, force?: boolean): Promise<boolean>

    forceSetUserPermission(connection: Connection, user: User, isAdmin: boolean): Promise<void>

    setUserPermission(connection: Connection, user: User, isAdmin: boolean, force:  true):    Promise<true>
    setUserPermission(connection: Connection, user: User, isAdmin: boolean, force?: boolean): Promise<boolean>

    forceCreateAdmin(connection: Connection, options?: CreateAdminOptions): Promise<void>

    createAdmin(connection: Connection, options?: CreateAdminOptions): Promise<boolean>

    forceCreateUser(connection: Connection, options: ForceCreateUserOptions): Promise<void>

    createUser(connection: Connection, options: CreateUserOptions): Promise<boolean>

    deleteAllUsers(connection: Connection): Promise<number>

    forceDeleteUser(connection: Connection, user: User): Promise<void>

    deleteUser(connection: Connection, user: User, force:  true):    Promise<true>
    deleteUser(connection: Connection, user: User, force?: boolean): Promise<boolean>

    forceGetUserInfoByCredentials(connection: Connection, login: string, password: string): Promise<UserInfo>

    getUserInfoByCredentials(connection: Connection, login: string, password: string, force:  true):    Promise<UserInfo>
    getUserInfoByCredentials(connection: Connection, login: string, password: string, force?: boolean): Promise<UserInfo | undefined>

    getAllUsersDeepInfo(connection: Connection): Promise<DeepUserInfo[]>

    forceGetDeepUserInfo(connection: Connection, user: User): Promise<DeepUserInfo>

    getDeepUserInfo(connection: Connection, user: User, force: true):     Promise<DeepUserInfo>
    getDeepUserInfo(connection: Connection, user: User, force?: boolean): Promise<DeepUserInfo | undefined>

    getAllUsersInfo(connection: Connection): Promise<UserInfo[]>

    forceGetUserLogin(connection: Connection, user: User): Promise<string>

    getUserLogin(connection: Connection, user: User, checkUser?: true):    Promise<string>
    getUserLogin(connection: Connection, user: User, checkUser?: boolean): Promise<string | undefined>

    forceGetUserId(connection: Connection, user: User): Promise<number>

    getUserId(connection: Connection, user: User, checkUser?: true):    Promise<number>
    getUserId(connection: Connection, user: User, checkUser?: boolean): Promise<number | undefined>

    forceGetUserInfo(connection: Connection, user: User): Promise<UserInfo>

    getUserInfo(connection: Connection, user: User, force:  true):    Promise<UserInfo>
    getUserInfo(connection: Connection, user: User, force?: boolean): Promise<UserInfo | undefined>
}

export class DefaultUserManager implements UserManager {
    readonly config:  Config
    readonly logger?: Logger
    
    constructor(options: CreationOptions) {
        this.config = options.config
        this.logger = options.logger
    }

    async forceSetUserName(connection: Connection, user: User, name: string | null) {
        await this.setUserName(connection, user, name, true)
    }

    async setUserName(connection: Connection, user: User, name: string | null, force:  true):            Promise<true>
    async setUserName(connection: Connection, user: User, name: string | null, force?: boolean):         Promise<boolean>
    async setUserName(connection: Connection, user: User, name: string | null, force:  boolean = false): Promise<boolean> {
        return false
    }

    async forceSetUserPassword(connection: Connection, user: User, password: string) {
        await this.setUserPassword(connection, user, password, true)
    }

    async setUserPassword(connection: Connection, user: User, password: string, force:  true):            Promise<true>
    async setUserPassword(connection: Connection, user: User, password: string, force?: boolean):         Promise<boolean>
    async setUserPassword(connection: Connection, user: User, password: string, force:  boolean = false): Promise<boolean> {
        return false
    }

    async forceSetUserPermission(connection: Connection, user: User, isAdmin: boolean) {
        await this.setUserPermission(connection, user, isAdmin, true)
    }

    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, force:  true):            Promise<true>
    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, force?: boolean):         Promise<boolean>
    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, force:  boolean = false): Promise<boolean> {
        return false
    }

    async forceCreateAdmin(connection: Connection, options?: CreateAdminOptions) {
        await this.createAdmin(connection, {
            ...options,
            force: true
        })
    }

    async createAdmin(connection: Connection, options?: CreateAdminOptions): Promise<boolean> {
        return false
    }

    async forceCreateUser(connection: Connection, options: ForceCreateUserOptions) {
        await this.createUser(connection, {
            ...options,
            force: true
        })
    }

    async createUser(connection: Connection, options: CreateUserOptions): Promise<boolean> {
        return false
    }

    async deleteAllUsers(connection: Connection): Promise<number> {
        this.logger?.warn("Deleting all users")

        const [info] = await connection.execute("DELETE Users") as [ResultSetHeader, FieldPacket[]]
        const count  = info.affectedRows

        this.logger?.warn(`Deleted (${count})`)

        return count
    }

    async forceDeleteUser(connection: Connection, user: User) {
        await this.deleteUser(connection, user, true)
    }

    async deleteUser(connection: Connection, user: User, force:  true):            Promise<true>
    async deleteUser(connection: Connection, user: User, force?: boolean):         Promise<boolean>
    async deleteUser(connection: Connection, user: User, force:  boolean = false): Promise<boolean> {
        return false
    }

    async forceGetUserInfoByCredentials(connection: Connection, login: string, password: string): Promise<UserInfo> {
        return await this.getUserInfoByCredentials(connection, login, password, true)
    }

    async getUserInfoByCredentials(connection: Connection, login: string, password: string, force:  true):            Promise<UserInfo>
    async getUserInfoByCredentials(connection: Connection, login: string, password: string, force?: boolean):         Promise<UserInfo | undefined>
    async getUserInfoByCredentials(connection: Connection, login: string, password: string, force:  boolean = false): Promise<UserInfo | undefined> {
        return undefined
    }

    async getAllUsersDeepInfo(connection: Connection): Promise<DeepUserInfo[]> {
        this.logger?.debug("Getting all users info...")

        const [rows] = await connection.execute({
            sql:        `SELECT * FROM Users target LEFT JOIN Users creator ON target.cr_id = creator.id`,
            nestTables: true
        }) as [RowDataPacket[], FieldPacket[]]

        return rows.map((row, i) => {
            const { target: t, creator: c } = row

            const info = {
                id:           t.id,
                login:        t.login,
                name:         t.name,
                passwordHash: t.password_hash,
                isAdmin:      t.is_admin,
                isOnline:     t.is_online,
                created:      t.cr_time,
                creatorInfo:  t.cr_id != null ? {
                    id:            c.id,
                    login:         c.login,
                    name:          c.name,
                    passwordHash:  c.password_hash,
                    isAdmin:       c.is_admin,
                    isOnline:      c.is_online,
                    created:       c.cr_time,
                    creatorId:     c.cr_id
                } : null
            }

            this.logger?.debug(`Got (${i}): ${deepUserInfoToString(info)}`)

            return info
        })
    }

    async forceGetDeepUserInfo(connection: Connection, user: User): Promise<DeepUserInfo> {
        return await this.getDeepUserInfo(connection, user, true)
    }

    async getDeepUserInfo(connection: Connection, user: User, force: true):            Promise<DeepUserInfo>
    async getDeepUserInfo(connection: Connection, user: User, force?: boolean):        Promise<DeepUserInfo | undefined>
    async getDeepUserInfo(connection: Connection, user: User, force: boolean = false): Promise<DeepUserInfo | undefined> {
        const numUser = typeof user === "number"

        this.logger?.debug(numUser ? `Getting deep info of user with id ${user}...`
                                   : `Getting deep info of user "${user}"...`)

        const whereSql = numUser ? "target.id = ?" : "target.login = ?"
        const sql      = `SELECT * FROM Users target LEFT JOIN Users creator ON target.cr_id = creator.id WHERE ${whereSql}`
        const [rows]   = await connection.execute({ sql, nestTables: true }, [user]) as [RowDataPacket[], FieldPacket[]]

        if (rows.length === 0) {
            if (force) {
                const message = numUser ? `User with id ${user} not found`
                                        : `User "${user}" not found`

                throw new LogicError(message)
            }

            this.logger?.debug("Not found")
        
            return undefined
        }

        const { target: t, creator: c } = rows[0]

        const info = {
            id:           t.id,
            login:        t.login,
            name:         t.name,
            passwordHash: t.password_hash,
            isAdmin:      t.is_admin,
            isOnline:     t.is_online,
            created:      t.cr_time,
            creatorInfo:  t.cr_id != null ? {
                id:            c.id,
                login:         c.login,
                name:          c.name,
                passwordHash:  c.password_hash,
                isAdmin:       c.is_admin,
                isOnline:      c.is_online,
                created:       c.cr_time,
                creatorId:     c.cr_id
            } : null
        }

        this.logger?.debug(`Got: ${deepUserInfoToString(info)}`)

        return info
    }

    async getAllUsersInfo(connection: Connection): Promise<UserInfo[]> {
        this.logger?.debug("Getting all users info...")

        const [rows] = await connection.execute("SELECT * FROM Users") as [RowDataPacket[], FieldPacket[]]

        return rows.map((row, i) => {
            const {
                id,
                login,
                cr_id:         creatorId,
                cr_time:       created,
                password_hash: passwordHash,
                is_admin:      isAdmin,
                is_online:     isOnline
            } = row

            const info = {
                id,
                login,
                creatorId,
                created,
                passwordHash,
                isAdmin,
                isOnline
            }

            this.logger?.debug(`Got (${i}): ${userInfoToString(info)}`)

            return info
        })
    }

    async forceGetUserLogin(connection: Connection, user: User): Promise<string> {
        return await this.getUserLogin(connection, user, true)
    }

    async getUserLogin(connection: Connection, user: User, checkUser?: true):            Promise<string>
    async getUserLogin(connection: Connection, user: User, checkUser?: boolean):         Promise<string | undefined>
    async getUserLogin(connection: Connection, user: User, checkUser:  boolean = false): Promise<string | undefined> {
        if (checkUser) {
            const info = await this.getUserInfo(connection, user, true)
            return info.login
        }

        if (typeof user === "string")
            return user

        const info = await this.getUserInfo(connection, user)

        return info?.login
    }

    async forceGetUserId(connection: Connection, user: User): Promise<number> {
        return await this.getUserId(connection, user, true)
    }

    async getUserId(connection: Connection, user: User, checkUser?: true):            Promise<number>
    async getUserId(connection: Connection, user: User, checkUser?: boolean):         Promise<number | undefined>
    async getUserId(connection: Connection, user: User, checkUser:  boolean = false): Promise<number | undefined> {
        if (checkUser) {
            const info = await this.getUserInfo(connection, user, true)
            return info.id
        }

        if (typeof user === "number")
            return user

        const info = await this.getUserInfo(connection, user)

        return info?.id
    }

    async forceGetUserInfo(connection: Connection, user: User): Promise<UserInfo> {
        return await this.getUserInfo(connection, user, true)
    }

    async getUserInfo(connection: Connection, user: User, force:  true):            Promise<UserInfo>
    async getUserInfo(connection: Connection, user: User, force?: boolean):         Promise<UserInfo | undefined>
    async getUserInfo(connection: Connection, user: User, force:  boolean = false): Promise<UserInfo | undefined> {
        const numUser = typeof user === "number"

        this.logger?.debug(numUser ? `Getting info of user with id ${user}...`
                                   : `Getting info of user "${user}"...`)

        const whereSql = numUser ? "id = ?" : "login = ?"
        const sql      = `SELECT * FROM Users WHERE ${whereSql}`
        const [rows]   = await connection.execute(sql, [user]) as [RowDataPacket[], FieldPacket[]]

        if (rows.length === 0) {
            if (force) {
                const message = numUser ? `User with id ${user} not found`
                                        : `User "${user}" not found`

                throw new LogicError(message)
            }

            this.logger?.debug("Not found")
        
            return undefined
        }

        const {
            id,
            login,
            cr_id:         creatorId,
            cr_time:       created,
            password_hash: passwordHash,
            is_admin:      isAdmin,
            is_online:     isOnline
        } = rows[0]

        const info = {
            id,
            login,
            creatorId,
            created,
            passwordHash,
            isAdmin,
            isOnline
        }

        this.logger?.debug(`Got: ${userInfoToString(info)}`)

        return info
    }
}

export function checkUserPassword(password: string) {
    const invalidReason = validateUserPassword(password)

    if (invalidReason !== undefined)
        throw new LogicError(invalidReason)
}

export function validateUserPassword(password: string): string | undefined {
    const MIN_LENGTH = 4

    if (password.length < MIN_LENGTH)
        return `Password is too short. Minimum ${MIN_LENGTH} characters required`

    const MAX_LENGTH = 255

    if (password.length > MAX_LENGTH)
        return `Password is too long. Maximum ${MAX_LENGTH} characters allowed`

    return undefined
}

export function checkUserLogin(login: string) {
    const invalidReason = validateUserLogin(login)

    if (invalidReason !== undefined)
        throw new LogicError(invalidReason)
}

export function validateUserLogin(login: string): string | undefined {
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

export function userInfoToString(info: UserInfo): string {
    return JSON.stringify({
        id:           info.id,
        login:        info.login,
        name:         info.name,
        passwordHash: info.passwordHash.toString("hex"),
        isOnline:     info.isOnline,
        isAdmin:      info.isAdmin,
        created:      info.created.toISOString(),
        creatorId:    info.creatorId
    }, null, 4)
}

export function deepUserInfoToString(info: DeepUserInfo): string {
    return JSON.stringify({
        id:           info.id,
        login:        info.login,
        name:         info.name,
        passwordHash: info.passwordHash.toString("hex"),
        isOnline:     info.isOnline,
        isAdmin:      info.isAdmin,
        created:      info.created.toISOString(),
        creatorInfo:  info.creatorInfo != null ? {
            id:           info.creatorInfo.id,
            login:        info.creatorInfo.login,
            name:         info.creatorInfo.name,
            passwordHash: info.creatorInfo.passwordHash.toString("hex"),
            isOnline:     info.creatorInfo.isOnline,
            isAdmin:      info.creatorInfo.isAdmin,
            created:      info.creatorInfo.created.toISOString(),
            creatorId:    info.creatorInfo.creatorId
        } : null
    }, null, 4)
}