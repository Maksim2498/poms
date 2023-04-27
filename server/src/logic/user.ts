import assert                                                      from "assert"
import Config                                                      from "Config"
import LogicError                                                  from "./LogicError"

import { Connection, FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise"
import { Logger                                                  } from "winston"
import { hasWs                                                   } from "util/string"

export interface CreationOptions {
    readonly config:  Config
    readonly logger?: Logger
}

export type User = string | number

export interface SetUserNameOptions {
    throwOnInvalidName?: boolean
    throwOnInvalidUser?: boolean
}

export interface SetUserPasswordOptions {
    throwOnInvalidPassword?: boolean
    throwOnInvalidUser?:     boolean
}

export interface ForceCreateAdminOptions {
    login?:    string
    password?: string
    name?:     string
    icon?:     Buffer | null
    creator?:  User   | null
}

export interface CreateAdminOptions extends ForceCreateAdminOptions {
    throwOnInvalidName?:     boolean
    throwOnInvalidLogin?:    boolean
    throwOnInvalidPassword?: boolean
    throwOnInvalidCreator?:  boolean
    throwOnDuplicate?:       boolean
}

export interface ForceCreateUserOptions {
    login:    string
    password: string
    name?:    string | null
    icon?:    Buffer | null
    isAdmin?: boolean
    creator?: User   | null
}

export interface CreateUserOptions extends ForceCreateUserOptions {
    throwOnInvalidName?:     boolean
    throwOnInvalidLogin?:    boolean
    throwOnInvalidPassword?: boolean
    throwOnInvalidCreator?:  boolean
    throwOnDuplicate?:       boolean
} 

export interface GetAllUsersInfoOptions {
    fetchIcon?: boolean
}

export interface UserRow {
    id:            number
    login:         string
    name:          string | null
    icon:          Buffer | null
    password_hash: Buffer
    is_admin:      boolean
    is_online:     boolean
    cr_time:       Date
    cr_id:         number | null
}

export interface UserInfo {
    id:           number
    login:        string
    name?:        string
    icon?:        Buffer
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
    created:      Date
    creatorId?:   number
}

export interface ForceGetUserInfoOptions {
    fetchIcon?: boolean
}

export interface GetUserInfoOptions extends ForceGetUserInfoOptions {
    throwOnFailure?: boolean
}

export interface DeepUserRow {
    target:  UserRow
    creator: UserRow | null
}

export interface DeepUserInfo {
    id:           number
    login:        string
    name?:        string
    icon?:        Buffer
    passwordHash: Buffer
    isAdmin:      boolean
    isOnline:     boolean
    created:      Date
    creatorInfo?: UserInfo
}

export interface ForceGetDeepUserInfoOptions {
    fetchIcon?:        boolean
    fetchCreatorIcon?: boolean
}

export interface GetDeepUserInfoOptions extends ForceGetDeepUserInfoOptions {
    throwOnFailure?: boolean
}

export interface UserManager {
    forceSetUserName(connection: Connection, user: User, name: string | null): Promise<void>

    setUserName(connection: Connection, user: User, name: string | null, options?: SetUserNameOptions): Promise<boolean>


    forceSetUserPassword(connection: Connection, user: User, password: string): Promise<void>

    setUserPassword(connection: Connection, user: User, password: string, options?: SetUserPasswordOptions): Promise<boolean>


    forceSetUserPermission(connection: Connection, user: User, isAdmin: boolean): Promise<void>

    setUserPermission(connection: Connection, user: User, isAdmin: boolean, throwOnFailure:  true):    Promise<true>
    setUserPermission(connection: Connection, user: User, isAdmin: boolean, throwOnFailure?: boolean): Promise<boolean>


    forceCreateAdmin(connection: Connection, options?: ForceCreateAdminOptions): Promise<void>

    createAdmin(connection: Connection, options?: CreateAdminOptions): Promise<boolean>


    forceCreateUser(connection: Connection, options: ForceCreateUserOptions): Promise<void>

    createUser(connection: Connection, options: CreateUserOptions): Promise<boolean>


    deleteAllUsers(connection: Connection): Promise<number>


    forceDeleteUser(connection: Connection, user: User): Promise<void>

    deleteUser(connection: Connection, user: User, throwOnFailure:  true):    Promise<true>
    deleteUser(connection: Connection, user: User, throwOnFailure?: boolean): Promise<boolean>


    forceGetUserInfoByCredentials(connection: Connection, login: string, password: string): Promise<UserInfo>

    getUserInfoByCredentials(connection: Connection, login: string, password: string, throwOnFailure:  true):    Promise<UserInfo>
    getUserInfoByCredentials(connection: Connection, login: string, password: string, throwOnFailure?: boolean): Promise<UserInfo | undefined>


    getAllUsersDeepInfo(connection: Connection): Promise<DeepUserInfo[]>


    forceGetDeepUserInfo(connection: Connection, user: User, options?: ForceGetDeepUserInfoOptions): Promise<DeepUserInfo>

    getDeepUserInfo(connection: Connection, user: User, options?: GetDeepUserInfoOptions): Promise<DeepUserInfo | undefined>


    getAllUsersInfo(connection: Connection, options?: GetAllUsersInfoOptions): Promise<UserInfo[]>


    forceGetUserLogin(connection: Connection, user: User): Promise<string>

    getUserLogin(connection: Connection, user: User, throwOnFailure?: true):    Promise<string>
    getUserLogin(connection: Connection, user: User, throwOnFailure?: boolean): Promise<string | undefined>


    forceGetUserId(connection: Connection, user: User): Promise<number>

    getUserId(connection: Connection, user: User, throwOnFailure?: true):    Promise<number>
    getUserId(connection: Connection, user: User, throwOnFailure?: boolean): Promise<number | undefined>


    forceGetUserInfo(connection: Connection, user: User, options?: ForceGetUserInfoOptions): Promise<UserInfo>

    getUserInfo(connection: Connection, user: User, options?: GetUserInfoOptions): Promise<UserInfo | undefined>
}

export class DefaultUserManager implements UserManager {
    readonly config:  Config
    readonly logger?: Logger
    
    constructor(options: CreationOptions) {
        this.config = options.config
        this.logger = options.logger
    }

    async forceSetUserName(connection: Connection, user: User, name: string | null) {
        await this.setUserName(connection, user, name, {
            throwOnInvalidName: true,
            throwOnInvalidUser: true
        })
    }

    async setUserName(connection: Connection, user: User, name: string | null, options?: SetUserNameOptions): Promise<boolean> {
        const numUser = typeof user === "number"

        if (this.logger) {
            const property = name == null ? null : `"${name}"`
            const message  = numUser ? `Setting name property to ${property} of user with id ${user}...`
                                     : `Setting name property to ${property} of user "${user}"...`

            this.logger?.debug(message)
        }

        name = normUserName(name)

        if (checkUserName(name, options?.throwOnInvalidName, this.logger) != null)
            return false

        const whereSql = numUser ? "id = ?" : "login = ?"
        const sql      = `UPDATE Users SET name = ? WHERE ${whereSql}`
        const [result] = await connection.execute(sql, [name, user]) as [ResultSetHeader, FieldPacket[]]

        if (result.affectedRows === 0) {
            const message = UserNotFoundError.makeMessage(user)

            if (options?.throwOnInvalidUser)
                throw new UserNotFoundError(user, message)

            this.logger?.debug(message)

            return false
        }

        this.logger?.debug("Set")

        return true
    }

    async forceSetUserPassword(connection: Connection, user: User, password: string) {
        await this.setUserPassword(connection, user, password, {
            throwOnInvalidPassword: true,
            throwOnInvalidUser:     true
        })
    }

    async setUserPassword(connection: Connection, user: User, password: string, options?: SetUserPasswordOptions): Promise<boolean> {
        const numUser = typeof user === "number"

        this.logger?.debug(numUser ? `Setting password of user with id ${user}...`
                                   : `Setting password of user "${user}"...`)

        if (checkUserPassword(password, options?.throwOnInvalidPassword, this.logger) != null)
            return false

        const login = await this.getUserLogin(connection, user, options?.throwOnInvalidUser)

        if (login == null)
            return false

        const toHash   = makePasswordHashString(login, password)
        const whereSql = numUser ? "id = ?" : "login = ?"
        const sql      = `UPDATE Users SET password_hash = UNHEX(SHA2(?, 512)) WHERE ${whereSql}`

        await connection.execute(sql, [toHash, user])

        this.logger?.debug("Set")

        return true
    }

    async forceSetUserPermission(connection: Connection, user: User, isAdmin: boolean) {
        await this.setUserPermission(connection, user, isAdmin, true)
    }

    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, throwOnFailure:  true):            Promise<true>
    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, throwOnFailure?: boolean):         Promise<boolean>
    async setUserPermission(connection: Connection, user: User, isAdmin: boolean, throwOnFailure:  boolean = false): Promise<boolean> {
        const numUser = typeof user === "number"

        this.logger?.debug(numUser ? `Setting isAdmin property to ${isAdmin} of user with id ${user}...`
                                   : `Setting isAdmin property to ${isAdmin} of user "${user}"...`)

        const whereSql = numUser ? "id = ?" : "login = ?"
        const sql      = `UPDATE Users SET is_admin = ? WHERE ${whereSql}`
        const [result] = await connection.execute(sql, [isAdmin, user]) as [ResultSetHeader, FieldPacket[]]

        if (result.affectedRows === 0) {
            const message = UserNotFoundError.makeMessage(user)

            if (throwOnFailure)
                throw new UserNotFoundError(user, message)

            this.logger?.debug(message)

            return false
        }

        this.logger?.debug("Set")

        return true
    }

    async forceCreateAdmin(connection: Connection, options?: CreateAdminOptions) {
        await this.createAdmin(connection, {
            ...options,
            throwOnInvalidLogin:    true,
            throwOnInvalidPassword: true,
            throwOnInvalidName:     true,
            throwOnInvalidCreator:  true,
            throwOnDuplicate:       true
        })
    }

    async createAdmin(connection: Connection, options?: CreateAdminOptions): Promise<boolean> {
        const login    = options?.login    ?? this.config.read.logic.admin.login
        const password = options?.password ?? this.config.read.logic.admin.password
        const name     = options?.name     ?? this.config.read.logic.admin.name

        const {
            icon,
            creator,
            throwOnInvalidLogin,
            throwOnInvalidPassword,
            throwOnInvalidName,
            throwOnInvalidCreator,
            throwOnDuplicate
        } = options ?? {}

        this.logger?.debug(`Creating admin "${login}"...`)

        const created = await this.createUser(connection, {
            isAdmin: true,
            login,
            password,
            name,
            icon,
            creator,
            throwOnInvalidLogin,
            throwOnInvalidPassword,
            throwOnInvalidName,
            throwOnInvalidCreator,
            throwOnDuplicate,
        })

        this.logger?.debug(created ? "Created" : "Not created")

        return created
    }

    async forceCreateUser(connection: Connection, options: ForceCreateUserOptions) {
        await this.createUser(connection, {
            ...options,
            throwOnInvalidLogin:    true,
            throwOnInvalidPassword: true,
            throwOnInvalidName:     true,
            throwOnInvalidCreator:  true,
            throwOnDuplicate:       true
        })
    }

    async createUser(connection: Connection, options: CreateUserOptions): Promise<boolean> {
        const {
            creator,
            password,
            isAdmin,
            icon,
        } = options

        const login = normUserLogin(options.login)
        const name  = normUserName(options.name)

        this.logger?.debug(`Creating user "${login}"...`)

        const invalid =  checkUserLogin(login, options.throwOnInvalidLogin, this.logger)          != null
                      || checkUserPassword(password, options.throwOnInvalidPassword, this.logger) != null
                      || checkUserName(name, options.throwOnInvalidName, this.logger)             != null

        if (invalid)
            return false

        const creatorId = await getCreatorId.call(this)

        if (creatorId === "not-found")
            return false

        const sql    = "INSERT INTO Users (login, name, icon, is_admin, cr_id, password_hash) VALUES (?, ?, ?, ?, ?, UNHEX(SHA2(?, 512)))"
        const toHash = makePasswordHashString(login, password)

        try {
            await connection.execute(sql, [
                login,
                name,
                icon    ?? null,
                isAdmin ?? false,
                creatorId,
                toHash
            ]) as [ResultSetHeader, FieldPacket[]]
        } catch (error) {
            if ((error as any).code !== "ER_DUP_ENTRY")
                throw error

            const message = `User "${login}" already exists`

            if (options.throwOnDuplicate)
                throw new LogicError(message)

            this.logger?.debug(message)

            return false
        }

        this.logger?.debug(`User "${login}" is created`)

        return true

        async function getCreatorId(this: DefaultUserManager): Promise<number | null | "not-found"> {
            if (creator == null)
                return null

            this.logger?.debug(typeof creator === "string" ? `Getting info of creator "${creator}"...`
                                                           : `Getting info of creator with id ${creator}...`)

            const id = await this.getUserId(connection, creator, options.throwOnInvalidCreator)

            if (id == null) {
                this.logger?.debug("Creator not found")
                return "not-found"
            }

            return id
        }
    }

    async deleteAllUsers(connection: Connection): Promise<number> {
        this.logger?.warn("Deleting all users")

        const [result] = await connection.execute("DELETE FROM Users") as [ResultSetHeader, FieldPacket[]]
        const count    = result.affectedRows

        this.logger?.warn(`Deleted (${count})`)

        return count
    }

    async forceDeleteUser(connection: Connection, user: User) {
        await this.deleteUser(connection, user, true)
    }

    async deleteUser(connection: Connection, user: User, throwOnFailure:  true):            Promise<true>
    async deleteUser(connection: Connection, user: User, throwOnFailure?: boolean):         Promise<boolean>
    async deleteUser(connection: Connection, user: User, throwOnFailure:  boolean = false): Promise<boolean> {
        const numUser = typeof user === "number"

        this.logger?.debug(numUser ? `Deleting user with id ${user}...`
                                   : `Deleting user "${user}"...`)

        const whereSql = numUser ? "id = ?" : "login = ?"
        const sql      = `DELETE FROM Users WHERE ${whereSql}`
        const [result] = await connection.execute(sql, [user]) as [ResultSetHeader, FieldPacket[]]

        if (result.affectedRows === 0) {
            const message = UserNotFoundError.makeMessage(user)

            if (throwOnFailure)
                throw new UserNotFoundError(user, message)
            
            this.logger?.debug(message)

            return false
        }

        return true
    }

    async forceGetUserInfoByCredentials(connection: Connection, login: string, password: string): Promise<UserInfo> {
        return await this.getUserInfoByCredentials(connection, login, password, true)
    }

    async getUserInfoByCredentials(connection: Connection, login: string, password: string, throwOnFailure:  true):            Promise<UserInfo>
    async getUserInfoByCredentials(connection: Connection, login: string, password: string, throwOnFailure?: boolean):         Promise<UserInfo | undefined>
    async getUserInfoByCredentials(connection: Connection, login: string, password: string, throwOnFailure:  boolean = false): Promise<UserInfo | undefined> {
        this.logger?.debug(`Getting info of user "${login}" by his/her credentials...`)

        const toHash   = `${login.toLowerCase()}:${password}`
        const whereSql = `login = ? and password_hash = UNHEX(SHA2(?, 512))`
        const sql      = `SELECT * FROM Users WHERE ${whereSql}`
        const [rows]   = await connection.execute(sql, [login, toHash]) as [UserRow[], FieldPacket[]]

        if (rows.length === 0) {
            const message = "Invalid credentials"

            if (throwOnFailure)
                throw new LogicError(message)
            
            this.logger?.debug(message)
            
            return undefined
        }

        const info = userRowToUserInfo(rows[0])

        this.logger?.debug(`Got: ${userInfoToString(info)}`)

        return info
    }

    async getAllUsersDeepInfo(connection: Connection): Promise<DeepUserInfo[]> {
        this.logger?.debug("Getting all users info...")

        const [rows] = await connection.execute({
            sql:        `SELECT * FROM Users target LEFT JOIN Users creator ON target.cr_id = creator.id`,
            nestTables: true
        }) as [RowDataPacket[], FieldPacket[]]

        return rows.map((row, i) => {
            const info = deepUserRowToDeepUserInfo(row as DeepUserRow)

            this.logger?.debug(`Got (${i}): ${deepUserInfoToString(info)}`)

            return info
        })
    }

    async forceGetDeepUserInfo(connection: Connection, user: User, options?: ForceGetDeepUserInfoOptions): Promise<DeepUserInfo> {
        return (await this.getDeepUserInfo(connection, user, {
            ...options,
            throwOnFailure: true
        }))!
    }

    async getDeepUserInfo(connection: Connection, user: User, options?: GetDeepUserInfoOptions): Promise<DeepUserInfo | undefined> {
        const numUser = typeof user === "number"

        this.logger?.debug(numUser ? `Getting deep info of user with id ${user}...`
                                   : `Getting deep info of user "${user}"...`)

        const whereSql   = numUser ? "target.id = ?" : "target.login = ?"
        const columnsSql = `target.id, target.login, target.name, target.cr_id, target.cr_time, target.password_hash, target.is_admin, target.is_online${options?.fetchIcon ? ", target.icon" : ""}, `
                         + `creator.id, creator.login, creator.name, creator.cr_id, creator.cr_time, creator.password_hash, creator.is_admin, creator.is_online${options?.fetchCreatorIcon ? ", creator.icon" : ""}`
        const sql        = `SELECT ${columnsSql} FROM Users target LEFT JOIN Users creator ON target.cr_id = creator.id WHERE ${whereSql}`
        const [rows]     = await connection.execute({ sql, nestTables: true }, [user]) as [RowDataPacket[], FieldPacket[]]

        if (rows.length === 0) {
            const message = UserNotFoundError.makeMessage(user)

            if (options?.throwOnFailure)
                throw new UserNotFoundError(user, message)

            this.logger?.debug(message)
        
            return undefined
        }

        const info = deepUserRowToDeepUserInfo(rows[0] as DeepUserRow)

        this.logger?.debug(`Got: ${deepUserInfoToString(info)}`)

        return info
    }

    async getAllUsersInfo(connection: Connection, options?: GetAllUsersInfoOptions): Promise<UserInfo[]> {
        this.logger?.debug("Getting all users info...")

        const columnsSql = `id, login, name, cr_id, cr_time, password_hash, is_admin, is_online${options?.fetchIcon ? ", icon" : ""}`
        const sql        = `SELECT ${columnsSql} FROM Users`
        const [rows]     = await connection.execute(sql) as [UserRow[], FieldPacket[]]

        return rows.map((row, i) => {
            const info = userRowToUserInfo(row)

            this.logger?.debug(`Got (${i}): ${userInfoToString(info)}`)

            return info
        })
    }

    async forceGetUserLogin(connection: Connection, user: User): Promise<string> {
        return await this.getUserLogin(connection, user, true)
    }

    async getUserLogin(connection: Connection, user: User, throwOnFailure?: true):            Promise<string>
    async getUserLogin(connection: Connection, user: User, throwOnFailure?: boolean):         Promise<string | undefined>
    async getUserLogin(connection: Connection, user: User, throwOnFailure:  boolean = false): Promise<string | undefined> {
        if (throwOnFailure) {
            const info = await this.forceGetUserInfo(connection, user)
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

    async getUserId(connection: Connection, user: User, throwOnFailure?: true):            Promise<number>
    async getUserId(connection: Connection, user: User, throwOnFailure?: boolean):         Promise<number | undefined>
    async getUserId(connection: Connection, user: User, throwOnFailure:  boolean = false): Promise<number | undefined> {
        if (throwOnFailure) {
            const info = await this.forceGetUserInfo(connection, user)
            return info.id
        }

        if (typeof user === "number")
            return user

        const info = await this.getUserInfo(connection, user)

        return info?.id
    }

    async forceGetUserInfo(connection: Connection, user: User, options?: ForceGetUserInfoOptions): Promise<UserInfo> {
        return (await this.getUserInfo(connection, user, {
            ...options,
            throwOnFailure: true
        }))!
    }

    async getUserInfo(connection: Connection, user: User, options?: GetUserInfoOptions): Promise<UserInfo | undefined> {
        const numUser = typeof user === "number"

        this.logger?.debug(numUser ? `Getting info of user with id ${user}...`
                                   : `Getting info of user "${user}"...`)

        const whereSql   = numUser ? "id = ?" : "login = ?"
        const columnsSql = `id, login, name, cr_id, cr_time, password_hash, is_admin, is_online${options?.fetchIcon ? ", icon" : ""}`
        const sql        = `SELECT ${columnsSql} FROM Users WHERE ${whereSql}`
        const [rows]     = await connection.execute(sql, [user]) as [UserRow[], FieldPacket[]]

        if (rows.length === 0) {
            const message = UserNotFoundError.makeMessage(user)

            if (options?.throwOnFailure)
                throw new UserNotFoundError(user, message)

            this.logger?.debug(message)
        
            return undefined
        }

        const info = userRowToUserInfo(rows[0])

        this.logger?.debug(`Got: ${userInfoToString(info)}`)

        return info
    }
}

export function checkUserPassword(password: string, throwOnFailure: boolean = false, logger?: Logger): string | undefined {
    return handleInvalidReason(validateUserPassword(password))
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

export function checkUserLogin(login: string, throwOnFailure: boolean = false, logger?: Logger): string | undefined {
    return handleInvalidReason(validateUserLogin(login))
}

export function validateUserLogin(login: string): string | undefined {
    const MIN_LENGTH = 4

    if (login.length < MIN_LENGTH)
        return `Login "${login}" is too short. Minimum ${MIN_LENGTH} characters required`

    const MAX_LENGTH = 255

    if (login.length > MAX_LENGTH)
        return `Login is too long. Maximum ${MAX_LENGTH} characters allowed`

    if (hasWs(login))
        return `Login "${login}" contains whitespace`

    return undefined
}

export function normUserLogin(login: string): string {
    return login.trim()
}

export function checkUserName(name: string | null, throwOnFailure: boolean = false, logger?: Logger): string | undefined {
    return handleInvalidReason(validateUserName(name))
}

function handleInvalidReason(invalidReason: string | undefined, throwOnFailure: boolean = false, logger?: Logger): string | undefined {
    if (invalidReason != null) {
        if (throwOnFailure)
            throw new LogicError(invalidReason)

        logger?.debug(logger)
    }

    return undefined
}

export function validateUserName(name: null):          undefined
export function validateUserName(name: string | null): string | undefined
export function validateUserName(name: string | null): string | undefined {
    if (name == null)
        return undefined

    const MAX_LENGTH = 255

    if (name.length > MAX_LENGTH)
        return `Name is too long. Maximum ${MAX_LENGTH} characters allowed`

    return undefined
}

export function normUserName(name: string):                    string
export function normUserName(name: string | undefined | null): string | null
export function normUserName(name: string | undefined | null): string | null {
    if (name == null)
        return null

    name = name.trim()

    if (name.length === 0)
        return null

    return name
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

export function userRowToUserInfo(row: UserRow): UserInfo {
    return {
        id:           row.id,
        login:        row.login,
        name:         row.name  ?? undefined,
        icon:         row.icon  ?? undefined,
        passwordHash: row.password_hash,
        isAdmin:      Boolean(row.is_admin),
        isOnline:     Boolean(row.is_online),
        created:      row.cr_time,
        creatorId:    row.cr_id ?? undefined
    }
}

export function deepUserRowToDeepUserInfo(rows: DeepUserRow): DeepUserInfo {
    const { target: t, creator: c } = rows

    assert(t.cr_id == c?.id)

    return {
        id:           t.id,
        login:        t.login,
        name:         t.name ?? undefined,
        icon:         t.icon ?? undefined,
        passwordHash: t.password_hash,
        isAdmin:      Boolean(t.is_admin),
        isOnline:     Boolean(t.is_online),
        created:      t.cr_time,
        creatorInfo:  t.cr_id != null ? userRowToUserInfo(c!)
                                      : undefined
    }
}

export function makePasswordHashString(login: string, password: string): string {
    return `${login.toLowerCase()}:${password}`
}

export default class UserNotFoundError extends LogicError {
    readonly user: User

    static makeMessage(user: User): string {
        return typeof user === "string" ? `User "${user}" not found`
                                        : `User with id ${user} not found`
    }

    constructor(user: User, message: string = UserNotFoundError.makeMessage(user)) {
        super(message)
        this.user = user
    }
}