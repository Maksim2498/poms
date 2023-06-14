import Config                                          from "Config"
import LogicError                                      from "logic/LogicError"
import TokenSet                                        from "logic/token/TokenSet"
import Token                                           from "logic/token/Token"
import CacheManager                                    from "util/buffer/CacheManager"
import UserNicknameSet                                 from "./UserNicknameSet"
import User                                            from "./User"
import UserRole                                        from "./UserRole"

import { Connection as MysqlConnection,
         FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise"
import { Logger                                      } from "winston"
import { CacheEntryKey                               } from "util/buffer/CacheManager"

export interface UserManagerOptions {
    readonly config:        Config
    readonly logger?:       Logger       | null
    readonly cacheManager?: CacheManager | null
}

export interface BaseUserCreationOptions {
    readonly login:         string
    readonly name?:         string | null
    readonly icon?:         Buffer | null
    readonly password?:     string
    readonly passwordHash?: Buffer
    readonly role?:         UserRole
    readonly creatorId?:    number | null
    readonly nicknames?:    Iterable<string>
    readonly tokens?:       Iterable<Token>
    readonly dontCheck?:    boolean
}

export interface PasswordUserCreationOptions extends BaseUserCreationOptions {
    readonly password: string
}

export interface PasswordHashUserCreationOptions extends BaseUserCreationOptions {
    readonly passwordHash: Buffer
}

export type UserCreationOptions = PasswordUserCreationOptions
                                | PasswordHashUserCreationOptions

export default class UserManager {
    private static _makeUserCacheEntryKeys(user: User): CacheEntryKey[] {
        return [
            UserManager._makeTokensCacheEntryKeys(user.tokens),
            UserManager._makeNicknamesCacheEntryKeys(user.nicknames),
            UserManager._makeLoginCacheEntryKey(user.login),
            UserManager._makeIdCacheEntryKey(user.id)
        ].flat()
    }

    private static _makeTokensCacheEntryKeys(tokens: Iterable<Token>): CacheEntryKey[] {
        const keys = new Array<CacheEntryKey>()

        for (const token of tokens)
            keys.push(...UserManager._makeTokenCacheEntryKeys(token))

        return keys
    }

    private static _makeTokenCacheEntryKeys(token: Token): CacheEntryKey[] {
        return [
            UserManager._makeTokenAccessIdCacheEntryKey(token.accessId),
            UserManager._makeTokenRefreshIdCacheEntryKey(token.refreshId),
        ]
    }

    private static _makeTokenAccessIdCacheEntryKey(accessId: string): CacheEntryKey {
        return `user-token-access-${accessId}`
    }

    private static _makeTokenRefreshIdCacheEntryKey(refresh: string): CacheEntryKey {
        return `user-token-refresh-${refresh}`
    }

    private static _makeNicknamesCacheEntryKeys(nicknames: Iterable<string>): CacheEntryKey[] {
        const keys = new Array<CacheEntryKey>()

        for (const nickname of nicknames)
            keys.push(UserManager._makeNicknameCacheEntryKey(nickname))

        return keys
    }

    private static _makeNicknameCacheEntryKey(nickname: string): CacheEntryKey {
        return `user-nickname-${nickname}`
    }

    private static _makeLoginCacheEntryKey(login: string): CacheEntryKey {
        return `user-login-${login.toLowerCase()}`
    }

    private static _makeIdCacheEntryKey(id: number): CacheEntryKey {
        return `user-id-${id}`
    }

    readonly config:       Config
    readonly logger:       Logger       | null
    readonly cacheManager: CacheManager | null

    constructor(options: UserManagerOptions) {
        this.config       = options.config
        this.logger       = options.logger       ?? null
        this.cacheManager = options.cacheManager ?? null

        this.logger?.debug("User manager created")
    }

    // ======== create ========

    async create(connection: MysqlConnection, options: UserCreationOptions): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    // ======== clear ========

    async clear(connection: MysqlConnection) {
        // TODO
        throw new Error("Not implemented")
    }

    // ======== delete ========

    async deleteByTokenRefreshId(connection: MysqlConnection, refreshId: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByTokenAccessId(connection: MysqlConnection, accessId: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByNickname(connection: MysqlConnection, nickname: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByCredentials(connection: MysqlConnection, login: string, password: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByLogin(connection: MysqlConnection, login: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteById(connection: MysqlConnection, id: number) {
        // TODO
        throw new Error("Not implemented")
    }

    // ======== get ========

    async getByTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async getByTokenAccessId(connection: MysqlConnection, accessId: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async getByNickname(connection: MysqlConnection, nickname: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async getByCredentials(connection: MysqlConnection, login: string, password: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async getByLogin(connection: MysqlConnection, login: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async getById(connection: MysqlConnection, id: number): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    // ======== set ========

    async set(connection: MysqlConnection, user: User) {
        // TODO
        throw new Error("Not implemented")
    }

    // ======== has ========

    async hasWithTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<boolean> {
        return this.hasWithTokenId(connection, refreshId, "refresh")
    }

    async hasWithTokenAccessId(connection: MysqlConnection, accessId: string): Promise<boolean> {
        return this.hasWithTokenId(connection, accessId, "access")
    }

    private async hasWithTokenId(connection: MysqlConnection, id: string, type: "access" | "refresh"): Promise<boolean> {
        id = Token.normId(id)

        this.logger?.debug(`Checking for presence of user with ${type} token ID ${id}...`)

        Token.checkNormedId(id)

        if (this.hasInCache(id, type === "access" ? UserManager._makeTokenAccessIdCacheEntryKey : UserManager._makeTokenRefreshIdCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute(
            `SELECT access_id FROM Tokens WHERE ${type}_id = ?`,
            [Buffer.from(id, "hex")]
        ) as [RowDataPacket[], FieldPacket[]]

        const has = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")
    
        return has
    }

    async hasWithNickname(connection: MysqlConnection, nickname: string): Promise<boolean> {
        nickname = UserNicknameSet.normNickname(nickname)
    
        this.logger?.debug(`Checking for presence of user with nickname ${nickname}...`)

        UserNicknameSet.checkNormedNickname(nickname)

        if (this.hasInCache(nickname, UserManager._makeNicknameCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT user_id FROM Nicknames WHERE nickname = ?", [nickname]) as [RowDataPacket[], FieldPacket[]]
        const has    = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")

        return has
    }

    async hasWithCredentials(connection: MysqlConnection, login: string, password: string): Promise<boolean> {
        login = User.normLogin(login)

        this.logger?.debug(`Checking for presence of user ${login} by his/her credentials...`)

        User.checkNormedLogin(login)
        User.checkPassword(password)

        const passwordHash = User.evalPasswordHashUnsafe(login, password)

        if (this.cacheManager != null) {
            this.logger?.debug("Checking cache...")

            const key  = UserManager._makeLoginCacheEntryKey(login)
            const user = this.cacheManager.get(key)

            if (user != null) {
                this.logger?.debug("Found entry with same login")
                this.logger?.debug("Checking password...")

                const userPasswordHash = User.passwordHashFromBuffer(user.buffer)

                if (passwordHash.equals(userPasswordHash)) {
                    this.logger?.debug("Matches")
                    return true
                }

                this.logger?.debug("Not matches")

                return false
            }

            this.logger?.debug("Not found")
        }

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute(
            "SELECT id FROM Users WHERE login = ? and password_hash = ?",
            [login, passwordHash]
        ) as [RowDataPacket[], FieldPacket[]]

        const has = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")

        return has
    }

    async hasWithLogin(connection: MysqlConnection, login: string): Promise<boolean> {
        login = User.normLogin(login)

        this.logger?.debug(`Checking for presence of user ${login}...`)

        User.checkNormedLogin(login)

        if (this.hasInCache(login, UserManager._makeLoginCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT id FROM Users WHERE login = ?", [login]) as [RowDataPacket[], FieldPacket[]]
        const has    = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")

        return has
    }

    async hasWithId(connection: MysqlConnection, id: number): Promise<boolean> {
        this.logger?.debug(`Checking for presence of user with id ${id}...`)

        User.checkId(id)

        if (this.hasInCache(id, UserManager._makeIdCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT id FROM Users WHERE id = ?", [id]) as [RowDataPacket[], FieldPacket[]]
        const has    = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")

        return has
    }

    private hasInCache<T>(value: T, makeKey: (value: T) => CacheEntryKey) {
        if (this.cacheManager == null)
            return false

        this.logger?.debug("Checking cache...")

        const key = makeKey(value)

        if (this.cacheManager.has(key)) {
            this.logger?.debug("Found")
            return true
        }

        this.logger?.debug("Not found")

        return false
    }

    // ======== getLastModified ========

    async getLastModifiedByTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedByTokenAccessId(connection: MysqlConnection, accessId: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedByNickname(connection: MysqlConnection, nickname: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedByCredentials(connection: MysqlConnection, login: string, password: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedById(connection: MysqlConnection, id: number): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    // ======== getId ========

    async getIdByTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByTokenAccessId(connection: MysqlConnection, accessId: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByNickname(connection: MysqlConnection, nickname: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByCredentials(connection: MysqlConnection, login: string, password: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByLogin(connection: MysqlConnection, login: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }
}