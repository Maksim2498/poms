import AsyncConnection         from "util/mysql/AsyncConnection"
import AsyncConnectionProvider from "util/mysql/AsyncConnectionProvider"
import Config                  from "Config"
import LogicError              from "./LogicError"

import { Logger              } from "winston"
import { ReadonlyTable       } from "util/mysql/Table"
import { expr                } from "util/mysql/Expression"
import { USERS_TABLE         } from "tables"

export type User = string | number

export interface CreateAdminOptions {
    login?:    string
    password?: string
    name?:     string
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

export default class UserManager {
    static checkPassword(password: string) {
        const invalidReason = this.validatePassword(password)

        if (invalidReason !== undefined)
            throw new LogicError(invalidReason)
    }

    static validatePassword(password: string): string | undefined {
        const MIN_LENGTH = 4

        if (password.length < MIN_LENGTH)
            return `Password is too short. Minimum ${MIN_LENGTH} characters required`

        const MAX_LENGTH = 255

        if (password.length > MAX_LENGTH)
            return `Password is too long. Maximum ${MAX_LENGTH} characters allowed`

        return undefined
    }

    static checkLogin(login: string) {
        const invalidReason = this.validateLogin(login)

        if (invalidReason !== undefined)
            throw new LogicError(invalidReason)
    }

    static validateLogin(login: string): string | undefined {
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

    readonly mysqlConnectionProvider: AsyncConnectionProvider
    readonly config:                  Config
    readonly logger?:                 Logger
    
    constructor(mysqlConnectionProvider: AsyncConnectionProvider, config: Config, logger?: Logger) {
        this.mysqlConnectionProvider = mysqlConnectionProvider
        this.config                  = config
        this.logger                  = logger
    }

    get mysqlConnection(): AsyncConnection {
        return this.mysqlConnectionProvider.mysqlConnection
    }

    async setUserName(user: User, name: string | null) {

    }

    async setUserPassword(user: User, password: string) {

    }

    async setUserPermission(user: User, isAdmin: boolean) {

    }

    async createAdmin(options?: CreateAdminOptions): Promise<boolean> {
        const login    = options?.login    ?? this.config.logicAdminLogin
        const password = options?.password ?? this.config.logicAdminName
        const name     = options?.name     ?? this.config.logicAdminName

        this.logger?.info(`Trying too create administrator "${login}"...`)
        this.logger?.info(`Checking if user "${login}" exists...`)

        const info = await this.getUserInfo(login)

        if (info == null) {
            this.logger?.info(`There is no user "${login}"`)

            return await this.createUser({
                login,
                password,
                name,
                isAdmin: true
            })
        } else {
            this.logger?.info(`User "${login}" already exists`)

            if (!info.isAdmin)
                this.logger?.warn(`User "${login}" doesn\'t have admin rights`)

            return false
        }
    }

    async createUser(options: CreateUserOptions): Promise<boolean> {
        const { login, password, name, isAdmin, creator, force } = options

        this.logger?.info(`Creaing user "${login}"...`)

        UserManager.checkLogin(login)

        let creatorId: number | undefined

        if (creator != null) {
            const creatorInfo = await this.getUserInfo(creator, true)

            if (!creatorInfo.isAdmin)
                throw new LogicError(`Only admin can be a creator of another user. "${creatorInfo.name}" isn't an admin`)

            creatorId = creatorInfo.id
        }

        const created = !!await USERS_TABLE.insert(this.mysqlConnection, {
            login,
            name,
            cr_id:         creatorId,
            password_hash: expr("UNHEX(SHA2(?, 512))", `${login}:${password}`),
            is_admin:      isAdmin ?? false
        })

        if (!created && force)
            throw new LogicError(`User "${login}" already exists`)

        this.logger?.info(created ? "Created" : "Already exists")

        return created
    }

    async deleteAllUserData(table: ReadonlyTable, user?: User, column?: string) {
        if (user == null) {
            await table.clear(this.mysqlConnection)
            return
        }

        this.logger?.info(typeof user === "string" ? `Deleting all ${table.name} of user "${user}"...`
                                                   : `Deleting all ${table.name} of user with id "${user}"...`)

        if (column === undefined)
            column = "user_id"

        const userId = await this.getUserId(user)

        await table.delete(this.mysqlConnection)
                   .where("?? = ?", column, userId)

        this.logger?.info("Deleted")
    }

    async deleteAllUsers() {
        await USERS_TABLE.clear(this.mysqlConnection)
    }

    async deleteUser(user: User) {
        switch (typeof user) {
            case "string":
                this.logger?.info(`Deleting user "${user}"...`)

                UserManager.checkLogin(user)

                await USERS_TABLE.delete(this.mysqlConnection)
                                 .where("login = ?", user)

                break

            case "number":
                this.logger?.info(`Deleting user with id ${user}...`)

                await USERS_TABLE.delete(this.mysqlConnection)
                                 .where("id = ?", user)
        }

        this.logger?.info("Deleted")
    }

    async getValidUserId(user: User): Promise<number> {
        return (await this.getUserInfo(user, true)).id
    }

    async getUserId(user: User): Promise<number> {
        return typeof user === "string" ? (await this.getUserInfo(user, true)).id
                                        : user
    }

    async getUserIdByCredentials(login: string, password: string): Promise<number> {
        UserManager.checkLogin(login)
        UserManager.checkPassword(password)

        const results = await USERS_TABLE.select(this.mysqlConnection, "id")
                                         .where(
                                             "login = ? and password_hash = UNHEX(SHA2(?, 512))",
                                             login,
                                             `${login}:${password}`
                                         )

        if (results.length === 0)
            throw new LogicError("Invalid login or password")

        return results[0].id
    }

    async getUserLogin(user: number, force: true):            Promise<string>
    async getUserLogin(user: number, force?: boolean):        Promise<string | undefined>
    async getUserLogin(user: number, force: boolean = false): Promise<string | undefined> {
        return (await this.getUserInfo(user, force))?.login
    }

    async getAllUsersDeepInfo(): Promise<DeepUserInfo[]> {
        const results = await USERS_TABLE.join(this.mysqlConnection, "target", USERS_TABLE, "creator", "target.cr_id = creator.id")
                                         .all()

        return results.map(result => {
            const { target: t, creator: c } = result

            return {
                id:           t.id,
                login:        t.login,
                name:         t.name,
                passwordHash: t.password_hash,
                isAdmin:      !!t.is_admin,
                isOnline:     !!t.is_online,
                created:      t.cr_time,
                creator:      t.cr_id != null ? {
                    id:           c.id,
                    login:        c.login,
                    name:         c.name,
                    passwordHash: c.password_hash,
                    isAdmin:      !!c.is_admin,
                    isOnline:     !!c.is_online,
                    created:      c.cr_time,
                    creator:      c.cr_id
                } : null
            }
        })
    }

    async getDeepUserInfo(user: User, force: true):            Promise<DeepUserInfo>
    async getDeepUserInfo(user: User, force?: boolean):        Promise<DeepUserInfo | undefined>
    async getDeepUserInfo(user: User, force: boolean = false): Promise<DeepUserInfo | undefined> {
        let where: string

        switch (typeof user) {
            case "string":
                UserManager.checkLogin(user)
                where = "target.login = ?"
                break

            case "number":
                where = "target.id = ?"
        }

        const results = await USERS_TABLE.join(this.mysqlConnection, "target", USERS_TABLE, "creator", "target.cr_id = creator.id")
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
            creator:      t.cr_id != null ? {
                id:           c.id,
                login:        c.login,
                name:         c.name,
                passwordHash: c.password_hash,
                isAdmin:      !!c.is_admin,
                isOnline:     !!c.is_online,
                created:      c.cr_time,
                creator:      c.cr_id
            } : null
        }
    }

    async getAllUsersInfo(): Promise<UserInfo[]> {
        const results = await USERS_TABLE.select(this.mysqlConnection)
                                         .all()

        return results.map(result => {
            return {
                id:           result.id,
                login:        result.login,
                name:         result.name,
                passwordHash: result.password_hash,
                isAdmin:      !!result.is_admin,
                isOnline:     !!result.is_online,
                created:      result.cr_time,
                creator:      result.cr_id
            }
        })
    }

    async getUserInfo(user: User, force:  true):            Promise<UserInfo>
    async getUserInfo(user: User, force?: boolean):         Promise<UserInfo | undefined>
    async getUserInfo(user: User, force:  boolean = false): Promise<UserInfo | undefined> {
        let where: string

        switch (typeof user) {
            case "string":
                UserManager.checkLogin(user)
                where = "login = ?"
                break

            case "number":
                where = "id = ?"
        }

        const results = await USERS_TABLE.select(this.mysqlConnection)
                                         .where(where, user)

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
}