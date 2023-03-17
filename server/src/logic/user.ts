import Config                                     from "Config"
import LogicError                                 from "./LogicError"

import { Connection, FieldPacket, RowDataPacket } from "mysql2/promise"
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

export class DefaultUserManager {
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

    async froceSetUserPermission(connection: Connection, user: User, isAdmin: boolean) {
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
        return 0
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
        return []
    }

    async forceGetDeepUserInfo(connection: Connection, user: User): Promise<DeepUserInfo> {
        return await this.getDeepUserInfo(connection, user, true)
    }

    async getDeepUserInfo(connection: Connection, user: User, force: true):            Promise<DeepUserInfo>
    async getDeepUserInfo(connection: Connection, user: User, force?: boolean):        Promise<DeepUserInfo | undefined>
    async getDeepUserInfo(connection: Connection, user: User, force: boolean = false): Promise<DeepUserInfo | undefined> {
        return undefined
    }

    async getAllUsersInfo(connection: Connection): Promise<UserInfo[]> {
        return []
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
        const numUser  = typeof user === "number"
        const whereSql = numUser ? "id = ?" : "login = ?"
        const sql      = `SELECT * FROM Users WHERE ${whereSql}`
        const [rows]   = await connection.execute(sql, [user]) as [RowDataPacket[], FieldPacket[]]

        if (rows.length === 0) {
            if (force) {
                const message = numUser ? `User with id ${user} not found`
                                        : `User "${user}" not found`

                throw new LogicError(message)
            }
        
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

        return {
            id,
            login,
            creatorId,
            created,
            passwordHash,
            isAdmin,
            isOnline
        }
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