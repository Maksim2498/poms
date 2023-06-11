import Config                                                          from "Config"
import LogicError                                                      from "logic/LogicError"
import TokenSet                                                        from "logic/token/TokenSet"
import Token                                                           from "logic/token/Token"
import CacheManager                                                    from "util/buffer/CacheManager"
import UserNicknameSet                                                 from "./UserNicknameSet"
import User                                                            from "./User"
import UserRole                                                        from "./UserRole"

import { Connection as MysqlConnection, FieldPacket, ResultSetHeader } from "mysql2/promise"
import { Logger                                                      } from "winston"
import { CacheEntryKey                                               } from "util/buffer/CacheManager"
import { escape                                                      } from "util/string"

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
            `user-token-access-${token.accessId}`,
            `user-token-refresh-${token.refreshId}`,
        ]
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

    async create(connection: MysqlConnection, options: UserCreationOptions): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async clear(connection: MysqlConnection) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByTokenRefreshId(connection: MysqlConnection, refreshId: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByTokenAccessId(connection: MysqlConnection, accessId: string) {
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

    async getAll(connection: MysqlConnection): Promise<User[]> {
        // TODO
        throw new Error("Not implemented")
    }

    async getByTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async getByTokenAccessId(connection: MysqlConnection, accessId: string): Promise<User> {
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

    async set(connection: MysqlConnection, user: User) {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithTokenAccessId(connection: MysqlConnection, accessId: string): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithCredentials(connection: MysqlConnection, login: string, password: string): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithLogin(connection: MysqlConnection, login: string): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithId(connection: MysqlConnection, id: number): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedByTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedByTokenAccessId(connection: MysqlConnection, accessId: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedByCredentials(connection: MysqlConnection, login: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getLastModifiedByLogin(connection: MysqlConnection, login: string): Promise<Date> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByTokenRefreshId(connection: MysqlConnection, refreshId: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByTokenAccessId(connection: MysqlConnection, accessId: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByCredentials(connection: MysqlConnection, login: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    async getIdByLogin(connection: MysqlConnection, login: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }
}