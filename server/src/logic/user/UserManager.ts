import Config                                                          from "Config"
import LogicError                                                      from "logic/LogicError"
import Token                                                           from "logic/token/Token"
import CacheManager                                                    from "util/buffer/CacheManager"
import UserNicknameSet                                                 from "./UserNicknameSet"
import User                                                            from "./User"
import UserRole                                                        from "./UserRole"

import { Connection as MysqlConnection, FieldPacket, ResultSetHeader } from "mysql2/promise"
import { Logger                                                      } from "winston"
import { CacheEntryKey                                               } from "util/buffer/CacheManager"
import { getStringCode                                               } from "util/error/error"
import { UserRoleName                                                } from "./UserRole"

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
    static makeUserCacheEntryKeys(user: User): CacheEntryKey[] {
        return [
            UserManager.makeTokensCacheEntryKeys(user.tokens),
            UserManager.makeNicknamesCacheEntryKeys(user.nicknames),
            UserManager.makeLoginCacheEntryKey(user.login),
            UserManager.makeIdCacheEntryKey(user.id)
        ].flat()
    }

    static makeTokensCacheEntryKeys(tokens: Iterable<Token>): CacheEntryKey[] {
        const keys = new Array<CacheEntryKey>()

        for (const token of tokens)
            keys.push(...UserManager.makeTokenCacheEntryKeys(token))

        return keys
    }

    static makeTokenCacheEntryKeys(token: Token): CacheEntryKey[] {
        return [
            UserManager.makeTokenAccessIdCacheEntryKey(token.accessId),
            UserManager.makeTokenRefreshIdCacheEntryKey(token.refreshId),
        ]
    }

    static makeTokenAccessIdCacheEntryKey(accessId: string): CacheEntryKey {
        return `user-token-access-${accessId}`
    }

    static makeTokenRefreshIdCacheEntryKey(refresh: string): CacheEntryKey {
        return `user-token-refresh-${refresh}`
    }

    static makeNicknamesCacheEntryKeys(nicknames: Iterable<string>): CacheEntryKey[] {
        const keys = new Array<CacheEntryKey>()

        for (const nickname of nicknames)
            keys.push(UserManager.makeNicknameCacheEntryKey(nickname))

        return keys
    }

    static makeNicknameCacheEntryKey(nickname: string): CacheEntryKey {
        return `user-nickname-${nickname}`
    }

    static makeLoginCacheEntryKey(login: string): CacheEntryKey {
        return `user-login-${login.toLowerCase()}`
    }

    static makeIdCacheEntryKey(id: number): CacheEntryKey {
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
        this.logger?.debug(`Creating user ${User.normLogin(options.login)}...`)

        const {
            login,
            name,
            icon,
            passwordHash,
            role,
            isOnline,
            created,
            creatorId,
            nicknames,
            tokens,
        } = User.prepareOptions({ ...options, config: this.config })

        checkIfExistsInCache.call(this)
        const user = await addToDatabase.call(this)
        addToCache.call(this, user)

        return user

        function checkIfExistsInCache(this: UserManager) {
            if (this.cacheManager == null)
                return

            this.logger?.debug("Checking cache for duplicates...")
                
            const loginKey = UserManager.makeLoginCacheEntryKey(login)

            if (this.cacheManager.has(loginKey))
                throw new LogicError(`User ${login} already exists`)

            for (const nickname of nicknames) {
                const nicknameKey = UserManager.makeNicknameCacheEntryKey(nickname)

                if (this.cacheManager.has(nicknameKey))
                    throw new LogicError(`User with nickname ${nickname} already exists`)
            }

            for (const token of tokens) {
                const tokenAccessIdKey = UserManager.makeTokenAccessIdCacheEntryKey(token.accessId)

                if (this.cacheManager.has(tokenAccessIdKey))
                    throw new LogicError(`User with token access id ${token.accessId} already exists`)

                const tokenRefreshIdKey = UserManager.makeTokenRefreshIdCacheEntryKey(token.refreshId)
            
                if (this.cacheManager.has(tokenRefreshIdKey))
                    throw new LogicError(`User with token refresh id ${token.refreshId} already exists`)
            }

            this.logger?.debug("Not found")
        }

        async function addToDatabase(this: UserManager): Promise<User> {
            try {
                this.logger?.debug("Adding to the database...")
                this.logger?.debug("Inserting to the Users table...")

                const [result] = await connection.execute(
                    "INSERT INTO Users (login, name, icon, cr_id, cr_time, password_hash, role, is_online) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        login,
                        name,
                        icon,
                        creatorId,
                        created,
                        passwordHash,
                        role.name,
                        isOnline,
                    ]
                ) as [ResultSetHeader, FieldPacket[]]

                this.logger?.debug("Inserted")
                
                const id = result.insertId

                this.logger?.debug(`User id is ${id}`)

                if (this.cacheManager != null) {
                    this.logger?.debug("Checking cache for users with the same id...")

                    const idKey = UserManager.makeIdCacheEntryKey(id)

                    if (this.cacheManager.has(idKey))
                        throw new Error(`Database created user with id already presented in the cache (${id})`)

                    this.logger?.debug("Not found")
                }

                if (nicknames.size !== 0) {
                    this.logger?.debug("Inserting into the Nicknames table...")

                    for (const nickname of nicknames)
                        try {
                            await connection.execute(`INSERT INTO Nicknames (user_id, nickname) VALUES (?, ?)`, [id, nickname])
                        } catch (error) {
                            if (getStringCode(error) !== "ER_DUP_ENTRY")
                                throw error

                            throw new LogicError(`User with nickname ${nickname} already exists`)
                        }

                    this.logger?.debug("Inserted")
                }

                if (tokens.size !== 0) {
                    this.logger?.debug("Inserting into the Tokens table...")

                    for (const token of tokens)
                        try {
                            await connection.execute(
                                "INSERT INTO Tokens (access_id, refresh_id, user_id, cr_time, access_exp_time, refresh_exp_time) VALUES (?, ?, ?, ?, ?, ?)",
                                [
                                    Buffer.from(token.accessId,  "hex"),
                                    Buffer.from(token.refreshId, "hex"),
                                    id,
                                    token.created,
                                    token.accessExpires,
                                    token.refreshExpires,
                                ]
                            )
                        } catch (error) {
                            if (getStringCode(error) !== "ER_DUP_ENTRY")
                                throw error

                            throw new LogicError(`Token access/refresh id ${token.accessId}/${token.refreshId} already exists`)
                        }

                    this.logger?.debug("Inserted")
                }

                this.logger?.debug("Added")

                return new User({
                    dontCheck: true,
                    config:    this.config,
                    id,
                    login,
                    name,
                    icon,
                    passwordHash,
                    role,
                    isOnline,
                    created,
                    creatorId,
                    nicknames,
                    tokens,
                })
            } catch (error) {
                if (getStringCode(error) !== "ER_DUP_ENTRY")
                    throw error

                throw new LogicError(`User ${login} already exists`)
            }
        }

        function addToCache(this: UserManager, user: User) {
            if (this.cacheManager == null)
                return

            this.logger?.debug("Adding to the cache...")

            const keys   = UserManager.makeUserCacheEntryKeys(user)
            const buffer = user.toBuffer()

            this.cacheManager.create(keys, buffer)

            this.logger?.debug("Added")
        }
    }

    // ======== clear ========

    async clear(connection: MysqlConnection) {
        this.logger?.warn("Deleting all users...")

        this.logger?.debug("Clearing users cache...")
        this.cacheManager?.clear()
        this.logger?.debug("Cleared")

        this.logger?.debug("Deleting from the database...")
        await connection.execute("DELETE FROM Users")
        this.logger?.debug("Deleted")

        this.logger?.debug("All users deleted")
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

        this.logger?.debug(`Checking for presence of user with token ${type} ID ${id}...`)

        Token.checkNormedId(id)

        if (this.hasInCache(id, type === "access" ? UserManager.makeTokenAccessIdCacheEntryKey : UserManager.makeTokenRefreshIdCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute(
            `SELECT access_id FROM Tokens WHERE ${type}_id = ?`,
            [Buffer.from(id, "hex")]
        ) as [UsersRow[], FieldPacket[]]

        const has = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")
    
        return has
    }

    async hasWithNickname(connection: MysqlConnection, nickname: string): Promise<boolean> {
        nickname = UserNicknameSet.normNickname(nickname)
    
        this.logger?.debug(`Checking for presence of user with nickname ${nickname}...`)

        UserNicknameSet.checkNormedNickname(nickname)

        if (this.hasInCache(nickname, UserManager.makeNicknameCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT user_id FROM Nicknames WHERE nickname = ?", [nickname]) as [UsersRow[], FieldPacket[]]
        const has    = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")

        return has
    }

    async hasWithLogin(connection: MysqlConnection, login: string): Promise<boolean> {
        login = User.normLogin(login)

        this.logger?.debug(`Checking for presence of user ${login}...`)

        User.checkNormedLogin(login)

        if (this.hasInCache(login, UserManager.makeLoginCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT id FROM Users WHERE login = ?", [login]) as [UsersRow[], FieldPacket[]]
        const has    = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")

        return has
    }

    async hasWithId(connection: MysqlConnection, id: number): Promise<boolean> {
        this.logger?.debug(`Checking for presence of user with id ${id}...`)

        User.checkId(id)

        if (this.hasInCache(id, UserManager.makeIdCacheEntryKey))
            return true

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT id FROM Users WHERE id = ?", [id]) as [UsersRow[], FieldPacket[]]
        const has    = rows.length !== 0

        this.logger?.debug(has ? "Found" : "Not found")

        return has
    }

    private hasInCache<T>(value: T, makeKey: (value: T) => CacheEntryKey): boolean {
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

    async getLastModifiedByTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<Date | undefined> {
        return this.getLastModifiedByTokenId(connection, refreshId, "refresh")
    }

    async getLastModifiedByTokenAccessId(connection: MysqlConnection, accessId: string): Promise<Date | undefined> {
        return this.getLastModifiedByTokenId(connection, accessId, "access")
    }

    private async getLastModifiedByTokenId(connection: MysqlConnection, id: string, type: "access" | "refresh"): Promise<Date | undefined> {
        id = Token.normId(id)

        this.logger?.debug(`Getting last modified date of user with ${type} ID ${id}...`)

        Token.checkNormedId(id)

        let lastModified = this.getLastModifiedFromCache(id, type === "access" ? UserManager.makeTokenAccessIdCacheEntryKey : UserManager.makeTokenRefreshIdCacheEntryKey)

        if (lastModified != null)
            return lastModified

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute(
            `SELECT mod_time FROM Tokens t LEFT JOIN Users u ON t.user_id = u.id WHERE t.${type}_id = ?`,
            [Buffer.from(id, "hex")]
        ) as [Pick<UsersRow, "mod_time">[], FieldPacket[]]

        lastModified = rows[0]?.mod_time

        this.logger?.debug(lastModified == null ? "Not found"
                                                : `Found: ${lastModified}`)

        return lastModified
    }

    async getLastModifiedByNickname(connection: MysqlConnection, nickname: string): Promise<Date | undefined> {
        nickname = UserNicknameSet.normNickname(nickname)

        this.logger?.debug(`Getting last modified date of user with nickname ${nickname}...`)

        UserNicknameSet.checkNickname(nickname)

        let lastModified = this.getLastModifiedFromCache(nickname, UserManager.makeNicknameCacheEntryKey)

        if (lastModified != null)
            return lastModified

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute(
            "SELECT mod_time FROM Nicknames n LEFT JOIN Users u ON n.user_id = u.id WHERE n.nickname = ?",
            [nickname]
        ) as [Pick<UsersRow, "mod_time">[], FieldPacket[]]

        lastModified = rows[0]?.mod_time

        this.logger?.debug(lastModified == null ? "Not found"
                                                : `Found: ${lastModified}`)

        return lastModified
    }

    async getLastModifiedByLogin(connection: MysqlConnection, login: string): Promise<Date | undefined> {
        login = User.normLogin(login)

        this.logger?.debug(`Getting last modified date of user ${login}...`)

        User.checkNormedLogin(login)

        let lastModified = this.getLastModifiedFromCache(login, UserManager.makeLoginCacheEntryKey)

        if (lastModified != null)
            return lastModified

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT mod_time FROM Users WHERE login = ?", [login]) as [Pick<UsersRow, "mod_time">[], FieldPacket[]]

        lastModified = rows[0]?.mod_time

        this.logger?.debug(lastModified == null ? "Not found"
                                                : `Found: ${lastModified}`)

        return lastModified
    }

    async getLastModifiedById(connection: MysqlConnection, id: number): Promise<Date | undefined> {
        this.logger?.debug(`Getting last modified date of user with id ${id}...`)

        let lastModified = this.getLastModifiedFromCache(id, UserManager.makeIdCacheEntryKey)

        if (lastModified != null)
            return lastModified

        this.logger?.debug("Checking database...")

        const [rows] = await connection.execute("SELECT mod_time FROM Users WHERE id = ?", [id]) as [Pick<UsersRow, "mod_time">[], FieldPacket[]]

        lastModified = rows[0]?.mod_time

        this.logger?.debug(lastModified == null ? "Not found"
                                                : `Found: ${lastModified}`)

        return lastModified
    }

    private getLastModifiedFromCache<T>(value: T, makeKey: (value: T) => CacheEntryKey): Date | undefined {
        if (this.cacheManager == null)
            return undefined

        this.logger?.debug("Checking cache...")

        const key   = makeKey(value)
        const entry = this.cacheManager.get(key)

        if (entry != null) {
            const { lastModified } = entry

            this.logger?.debug(`Found: ${lastModified}`)

            return lastModified
        }

        this.logger?.debug("Not found")

        return undefined
    }
}

interface UsersRow {
    id:            number
    login:         string
    name:          string | null
    icon:          Buffer | null
    cr_id:         number | null
    cr_time:       Date
    mod_time:      Date
    password_hash: Buffer
    role:          UserRoleName
    is_online:     boolean
}

interface NicknamesRow {
    user_id:  number
    nickname: string
}

interface TokensRow {
    access_id:        Buffer
    refresh_id:       Buffer
    user_id:          number
    cr_time:          Date
    access_exp_time:  Date
    refresh_exp_time: Date
}