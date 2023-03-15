import Config         from "Config"
import LogicError     from "./LogicError"

import { Connection } from "mysql2/promise"
import { Logger     } from "winston"

export interface CreationOptions {
    readonly config:  Config
    readonly logger?: Logger
}

export type User = string | number

export interface CreateAdminOptions {
    login?:    string
    password?: string
    name?:     string
    force?:    boolean
}

export interface CreateUserOptions {
    login:      string
    password:   string
    name?:      string
    isAdmin?:   boolean
    creator?:   User
    force?:     boolean
} 

export interface DeepUserInfo {
    id:           number
    login:        string
    name:         string | null
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
    created:      Date
    creator:      UserInfo | null
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

export interface UserManager {
    setUserName(connection: Connection, user: User, name: string | null, force:  true):    Promise<true>
    setUserName(connection: Connection, user: User, name: string | null, force?: boolean): Promise<boolean>

    setUserPassword(connection: Connection, user: User, password: string, force:  true):    Promise<true>
    setUserPassword(connection: Connection, user: User, password: string, force?: boolean): Promise<boolean>

    setUserPermission(connection: Connection, user: User, isAdmin: boolean, force:  true):    Promise<true>
    setUserPermission(connection: Connection, user: User, isAdmin: boolean, force?: boolean): Promise<boolean>

    createAdmin(connection: Connection, options?: CreateAdminOptions): Promise<boolean>

    createUser(connection: Connection, options: CreateUserOptions): Promise<boolean>

    deleteAllUsers(connection: Connection, force?: boolean): Promise<number>

    deleteUser(connection: Connection, user: User, force:  true):    Promise<true>
    deleteUser(connection: Connection, user: User, force?: boolean): Promise<boolean>

    getUserInfoByCredentials(connection: Connection, login: string, password: string, force:  true):    Promise<UserInfo | undefined>
    getUserInfoByCredentials(connection: Connection, login: string, password: string, force?: boolean): Promise<UserInfo | undefined>

    getAllUsersDeepInfo(connection: Connection): Promise<DeepUserInfo[]>

    getDeepUserInfo(connection: Connection, user: User, force: true):     Promise<DeepUserInfo>
    getDeepUserInfo(connection: Connection, user: User, force?: boolean): Promise<DeepUserInfo | undefined>

    getAllUsersInfo(connection: Connection): Promise<UserInfo[]>

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

    async setUserName(connection: Connection, user: User, name: string | null, force:  true):            Promise<true>
    async setUserName(connection: Connection, user: User, name: string | null, force?: boolean):         Promise<boolean>
    async setUserName(connection: Connection, user: User, name: string | null, force:  boolean = false): Promise<boolean> {
        return false
    }

    async setUserPassword(connection: Connection, user: User, password: string, force:  true):            Promise<true>
    async setUserPassword(connection: Connection, user: User, password: string, force?: boolean):         Promise<boolean>
    async setUserPassword(connection: Connection, user: User, password: string, force:  boolean = false): Promise<boolean> {
        return false
    }

    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, force:  true):            Promise<true>
    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, force?: boolean):         Promise<boolean>
    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, force:  boolean = false): Promise<boolean> {
        return false
    }

    async createAdmin(connection: Connection, options?: CreateAdminOptions): Promise<boolean> {
        return false
    }

    async createUser(connection: Connection, options: CreateUserOptions): Promise<boolean> {
        return false
    }

    async deleteAllUsers(connection: Connection, force: boolean = false): Promise<number> {
        return 0
    }

    async deleteUser(connection: Connection, user: User, force:  true):            Promise<true>
    async deleteUser(connection: Connection, user: User, force?: boolean):         Promise<boolean>
    async deleteUser(connection: Connection, user: User, force:  boolean = false): Promise<boolean> {
        return false
    }

    async getUserInfoByCredentials(connection: Connection, login: string, password: string, force:  true):            Promise<UserInfo | undefined>
    async getUserInfoByCredentials(connection: Connection, login: string, password: string, force?: boolean):         Promise<UserInfo | undefined>
    async getUserInfoByCredentials(connection: Connection, login: string, password: string, force:  boolean = false): Promise<UserInfo | undefined> {
        return undefined
    }

    async getAllUsersDeepInfo(connection: Connection): Promise<DeepUserInfo[]> {
        return []
    }

    async getDeepUserInfo(connection: Connection, user: User, force: true):            Promise<DeepUserInfo>
    async getDeepUserInfo(connection: Connection, user: User, force?: boolean):        Promise<DeepUserInfo | undefined>
    async getDeepUserInfo(connection: Connection, user: User, force: boolean = false): Promise<DeepUserInfo | undefined> {
        return undefined
    }

    async getAllUsersInfo(connection: Connection): Promise<UserInfo[]> {
        return []
    }

    async getUserInfo(connection: Connection, user: User, force:  true):            Promise<UserInfo>
    async getUserInfo(connection: Connection, user: User, force?: boolean):         Promise<UserInfo | undefined>
    async getUserInfo(connection: Connection, user: User, force:  boolean = false): Promise<UserInfo | undefined> {
        return undefined
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