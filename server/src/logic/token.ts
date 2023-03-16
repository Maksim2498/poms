import Config                from "Config"
import LogicError            from "./LogicError"

import { Connection        } from "mysql2/promise"
import { Logger            } from "winston"
import { UserManager, User } from "./user"

export interface CreationOptions {
    readonly userManager: UserManager
    readonly config:      Config
    readonly logger?:     Logger
}

export interface TokenPair {
    id:      Token
    refresh: Token
}

export interface Token {
    id:   Buffer
    exp?: Date
}

export interface TokenPairJson {
    access:  TokenJson
    refresh: TokenJson
}

export interface TokenJson {
    id:   string
    exp?: string
}

export interface ATokenInfo {
    id:       Buffer
    userId:   number
    exp:      Date
    creation: Date
}

export interface RTokenInfo {
    id:       Buffer
    aTokenId: Buffer
    exp:      Date
    created:  Date
}

export interface TokenManager {
    deleteUserExtraATokens(connection: Connection, user: User, limit: number, checkUser?: boolean): Promise<number>

    getUserATokenCount(connection: Connection, user: User, checkUser?: boolean): Promise<number>

    checkATokenIsActive(connection: Connection, token: ATokenInfo | Buffer | undefined | null): Promise<void>

    isATokenActive(connection: Connection, token: ATokenInfo | Buffer | undefined | null): Promise<boolean>

    createTokenPair(connection: Connection, user: User): Promise<TokenPair>

    deleteAllUserATokens(connection: Connection, user: User, checkUser?: boolean): Promise<number>

    deleteAllATokens(connection: Connection): Promise<number>

    deleteAllUserRTokens(connection: Connection, user: User, checkUser?: boolean): Promise<number>

    deleteAllRTokens(connection: Connection): Promise<number>

    deleteAToken(connection: Connection, aTokenId: Buffer, force:  true):    Promise<true>
    deleteAToken(connection: Connection, aTokenId: Buffer, force?: boolean): Promise<boolean>

    deleteRToken(connection: Connection, aTokenId: Buffer, force:  true):    Promise<true>
    deleteRToken(connection: Connection, aTokenId: Buffer, force?: boolean): Promise<boolean>

    getATokenInfo(connection: Connection, aTokenId: Buffer, force:  true):    Promise<ATokenInfo>
    getATokenInfo(connection: Connection, aTokenId: Buffer, force?: boolean): Promise<ATokenInfo | undefined>

    getRTokenInfo(connection: Connection, rTokenId: Buffer, force:  true):    Promise<RTokenInfo>
    getRTokenInfo(connection: Connection, rTokenId: Buffer, force?: boolean): Promise<RTokenInfo | undefined>
}

export class DefaultTokenManager implements TokenManager {
    readonly userManager: UserManager
    readonly config:      Config
    readonly logger?:     Logger

    constructor(options: CreationOptions) {
        this.userManager = options.userManager
        this.config      = options.config
        this.logger      = options.logger
    }

    async deleteUserExtraATokens(connection: Connection, user: User, limit: number, checkUser: boolean = false): Promise<number> {
        return 0
    }

    async getUserATokenCount(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        return 0
    }

    async checkATokenIsActive(connection: Connection, token: ATokenInfo | Buffer | undefined | null) {
    }

    async isATokenActive(connection: Connection, token: ATokenInfo | Buffer | undefined | null): Promise<boolean> {
        return false
    }

    async createTokenPair(connection: Connection, user: User): Promise<TokenPair> {
        return {} as TokenPair
    }

    async deleteAllUserATokens(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        return 0
    }

    async deleteAllATokens(connection: Connection): Promise<number> {
        return 0
    }

    async deleteAllUserRTokens(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        return 0
    }

    async deleteAllRTokens(connection: Connection): Promise<number> {
        return 0
    }

    async deleteAToken(connection: Connection, aTokenId: Buffer, force:  true):            Promise<true>
    async deleteAToken(connection: Connection, aTokenId: Buffer, force?: boolean):         Promise<boolean>
    async deleteAToken(connection: Connection, aTokenId: Buffer, force:  boolean = false): Promise<boolean> {
        return false
    }

    async deleteRToken(connection: Connection, rTokenId: Buffer, force:  true):            Promise<true>
    async deleteRToken(connection: Connection, rTokenId: Buffer, force?: boolean):         Promise<boolean>
    async deleteRToken(connection: Connection, rTokenId: Buffer, force:  boolean = false): Promise<boolean> {
        return false
    }

    async getATokenInfo(connection: Connection, aTokenId: Buffer, force:  true):            Promise<ATokenInfo>
    async getATokenInfo(connection: Connection, aTokenId: Buffer, force?: boolean):         Promise<ATokenInfo | undefined>
    async getATokenInfo(connection: Connection, aTokenId: Buffer, force:  boolean = false): Promise<ATokenInfo | undefined> {
        return {} as ATokenInfo
    }

    async getRTokenInfo(connection: Connection, rTokenId: Buffer, force:  true):            Promise<RTokenInfo>
    async getRTokenInfo(connection: Connection, rTokenId: Buffer, force?: boolean):         Promise<RTokenInfo | undefined>
    async getRTokenInfo(connection: Connection, rTokenId: Buffer, force:  boolean = false): Promise<RTokenInfo | undefined> {
        return {} as RTokenInfo
    }
}

export function parseTokenId(string: string): Buffer {
    const id = safeParseTokenId(string)

    if (id === undefined)
        throw new Error("Invalid token string")

    return id
}

export function safeParseTokenId(string: string): undefined | Buffer {
    return isValidTokenIdString(string) ? Buffer.from(string, "hex")
                                        : undefined
}

export function isValidTokenIdString(string: string): boolean {
    return string.match(/^[0-9a-fA-F]{128}$/) != null
}

export function tokenPairToJson(tokenPair: TokenPair): TokenPairJson {
    return {
        access:  tokenToJson(tokenPair.id),
        refresh: tokenToJson(tokenPair.refresh)
    }
}

export function tokenToJson(token: Token): TokenJson {
    return {
        id:  token.id.toString("hex"),
        exp: token.exp?.toISOString()
    }
}

export function checkTokenId(id: Buffer) {
    const invalidReason = validateTokenId(id)

    if (invalidReason !== undefined)
        throw new LogicError(invalidReason)
}

export function validateTokenId(id: Buffer): string | undefined {
    const LENGTH = 64

    if (id.length !== LENGTH)
        return `Invalid token length. Expected: ${LENGTH}. Got: ${id.length}`

    return undefined
}