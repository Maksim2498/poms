import crypto                             from "crypto"
import LogicError                         from "./LogicError"
import TokenExpiredError                  from "./TokenExpiredError"
import UserManager                        from "./UserManager"

import { A_TOKENS_TABLE, R_TOKENS_TABLE } from "tables"
import { dateMillisAhead                } from "util/date"
import { isHex                          } from "util/string"
import { User                           } from "./UserManager"

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

export default class TokenManager {
    static isValidTokenIdString(string: string): boolean {
        return string.length === 128 // 64 bytes represented as hex digits (1 byte = 2 hex digits)
            && isHex(string)
    }

    static createTokenIdFromString(string: string): Buffer {
        const id = this.tryCreateTokenIdFromString(string)

        if (id === undefined)
            throw new Error("Invalid token string")

        return id
    }

    static tryCreateTokenIdFromString(string: string): undefined | Buffer {
        return this.isValidTokenIdString(string) ? Buffer.from(string, "hex")
                                                 : undefined
    }

    static createTokenId(): Buffer {
        const id = crypto.randomBytes(64)
        id.writeUInt32BE(Date.now() / 1000, id.length - 4)
        return id
    }

    static tokenPairToJson(tokenPair: TokenPair): TokenPairJson {
        return {
            access:  this.tokenToJson(tokenPair.id),
            refresh: this.tokenToJson(tokenPair.refresh)
        }
    }

    static tokenToJson(token: Token): TokenJson {
        return {
            id:  token.id.toString("hex"),
            exp: token.exp?.toISOString()
        }
    }

    static checkTokenId(id: Buffer) {
        const invalidReason = this.validateTokenId(id)

        if (invalidReason !== undefined)
            throw new LogicError(invalidReason)
    }

    static validateTokenId(id: Buffer): string | undefined {
        const LENGTH = 64

        if (id.length !== LENGTH)
            return `Invalid token length. Expected: ${LENGTH}. Got: ${id.length}`

        return undefined
    }

    readonly userManager: UserManager

    constructor(userManager: UserManager) {
        this.userManager = userManager
    }

    async deleteUserExtraATokens(user: User, limit: number) {
        const id    = await this.userManager.getUserId(user)
        const count = await this.getUserATokenCount(user)

        if (limit >= count)
            return

        const diff = count - limit

        await A_TOKENS_TABLE.delete(this.userManager.mysqlConnection)
                            .orderBy("cr_time")
                            .limit(diff)
                            .where("user_id = ?", id)
    }

    async getUserATokenCount(user: User): Promise<number> {
        const userId  = await this.userManager.getUserId(user)
        const results = await A_TOKENS_TABLE.unsafeSelect(this.userManager.mysqlConnection, "count(*) as count")
                                            .where("user_id = ?", userId)

        return results[0]?.count ?? 0;
    }

    async checkATokenIsActive(token: ATokenInfo | Buffer | undefined | null) {
        if (!await this.isATokenActive(token))
            throw new TokenExpiredError("Unregistered or expired token")
    }

    async isATokenActive(token: ATokenInfo | Buffer | undefined | null): Promise<boolean> {
        const info = token instanceof Buffer ?  await this.getATokenInfo(token)
                                             : token

        return info != null && info.exp > new Date()
    }

    async createTokenPair(user: User): Promise<TokenPair> {
        const userId     = await this.userManager.getUserId(user)
        const aTokenId   = TokenManager.createTokenId()
        const config     = this.userManager.config
        const aTokenExp  = dateMillisAhead(config.logicATokenLifetime)
        const rTokenId   = TokenManager.createTokenId()
        const rTokenExp  = dateMillisAhead(config.logicRTokenLifetime)
        const connection = this.userManager.mysqlConnection

        await A_TOKENS_TABLE.insert(connection, {
            id:       aTokenId,
            user_id:  userId,
            exp_time: aTokenExp
        })

        await R_TOKENS_TABLE.insert(connection, {
            id:        rTokenId,
            atoken_id: aTokenId,
            exp_time:  rTokenExp
        })

        return {
            id: {
                id:  aTokenId,
                exp: aTokenExp
            },

            refresh: {
                id:  rTokenId,
                exp: rTokenExp
            }
        }
    }

    async deleteAllATokens(user?: User) {
        await this.userManager.deleteAllUserData(A_TOKENS_TABLE, user)
    }

    async deleteAllRTokens(user?: User) {
        await this.userManager.deleteAllUserData(R_TOKENS_TABLE, user)
    }

    async deleteAToken(aTokenId: Buffer) {
        TokenManager.checkTokenId(aTokenId)

        await A_TOKENS_TABLE.delete(this.userManager.mysqlConnection)
                            .where("id = ?", aTokenId)
    }

    async deleteRToken(rTokenId: Buffer) {
        TokenManager.checkTokenId(rTokenId)

        await R_TOKENS_TABLE.delete(this.userManager.mysqlConnection)
                            .where("id = ?", rTokenId)
    }

    async getATokenInfo(aTokenId: Buffer, force: true):            Promise<ATokenInfo>
    async getATokenInfo(aTokenId: Buffer, force?: boolean):        Promise<ATokenInfo | undefined>
    async getATokenInfo(aTokenId: Buffer, force: boolean = false): Promise<ATokenInfo | undefined> {
        TokenManager.checkTokenId(aTokenId)

        const results = await A_TOKENS_TABLE.select(this.userManager.mysqlConnection)
                                            .where("id = ?", aTokenId)

        if (!results.length) {
            if (force)
                throw new LogicError("Invalid access token")

            return undefined
        }

        const { id, user_id, exp_time, cr_time } = results[0]

        return {
            id,
            userId:   user_id,
            exp:      exp_time,
            creation: cr_time
        }
    }

    async getRTokenInfo(rTokenId: Buffer, force: true):            Promise<RTokenInfo>
    async getRTokenInfo(rTokenId: Buffer, force?: boolean):        Promise<RTokenInfo | undefined>
    async getRTokenInfo(rTokenId: Buffer, force: boolean = false): Promise<RTokenInfo | undefined> {
        TokenManager.checkTokenId(rTokenId)

        const results = await R_TOKENS_TABLE.select(this.userManager.mysqlConnection)
                                            .where("id = ?", rTokenId)

        if (!results.length) {
            if (force)
                throw new LogicError("Invalid refresh token")

            return undefined
        }

        const { id, atoken_id, exp_time, cr_time } = results[0]

        return {
            id,
            aTokenId: atoken_id,
            exp:      exp_time,
            created:  cr_time
        }
    }
}