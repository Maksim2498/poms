import crypto                                                      from "crypto"
import Config                                                      from "Config"
import LogicError                                                  from "./LogicError"
import TokenExpiredError                                           from "./TokenExpiredError"
import TokenNotFoundError                                          from "./TokenNotFoundError"

import { Connection, FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2/promise"
import { Logger                                                  } from "winston"
import { dateMillisecondsAhead                                   } from "util/date"
import { UserManager, User                                       } from "./user"

export interface CreationOptions {
    readonly userManager: UserManager
    readonly config:      Config
    readonly logger?:     Logger
}

export interface TokenPair {
    access:  Token
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
    id:      Buffer
    userId:  number
    exp:     Date
    created: Date
}

export interface RTokenInfo {
    id:       Buffer
    aTokenId: Buffer
    exp:      Date
    created:  Date
}

export interface ATokenRow {
    id:       Buffer
    user_id:  number
    cr_time:  Date
    exp_time: Date
}

export interface RTokenRow {
    id:        Buffer
    atoken_id: Buffer
    cr_time:   Date
    exp_time:  Date
}

export interface TokenManager {
    deleteUserExtraATokens(connection: Connection, user: User, limit: number, throwOnFailure?: boolean): Promise<number>


    forceGetUserATokenCount(connection: Connection, user: User): Promise<number>

    getUserATokenCount(connection: Connection, user: User, throwOnFailure?: boolean): Promise<number>


    checkATokenIsActive(connection: Connection, tokenId: ATokenInfo | Buffer | undefined | null): Promise<void>


    isATokenActive(connection: Connection, tokenId: ATokenInfo | Buffer | undefined | null): Promise<boolean>

    forceCreateTokenPair(connection: Connection, user: User): Promise<TokenPair>

    createTokenPair(connection: Connection, user: User, throwOnFailure:  true):    Promise<TokenPair>
    createTokenPair(connection: Connection, user: User, throwOnFailure?: boolean): Promise<TokenPair | undefined>


    forceDeleteAllUserATokens(connection: Connection, user: User): Promise<number>

    deleteAllUserATokens(connection: Connection, user: User, throwOnFailure?: boolean): Promise<number>


    deleteAllATokens(connection: Connection): Promise<number>


    forceDeleteAToken(connection: Connection, aTokenId: Buffer): Promise<void>

    deleteAToken(connection: Connection, aTokenId: Buffer, throwOnFailure:  true):    Promise<true>
    deleteAToken(connection: Connection, aTokenId: Buffer, throwOnFailure?: boolean): Promise<boolean>


    forceGetATokenInfo(connection: Connection, aTokenId: Buffer): Promise<ATokenInfo>

    getATokenInfo(connection: Connection, aTokenId: Buffer, throwOnFailure:  true):    Promise<ATokenInfo>
    getATokenInfo(connection: Connection, aTokenId: Buffer, throwOnFailure?: boolean): Promise<ATokenInfo | undefined>


    forceGetRTokenInfo(connection: Connection, rTokenId: Buffer): Promise<RTokenInfo>

    getRTokenInfo(connection: Connection, rTokenId: Buffer, throwOnFailure:  true):    Promise<RTokenInfo>
    getRTokenInfo(connection: Connection, rTokenId: Buffer, throwOnFailure?: boolean): Promise<RTokenInfo | undefined>
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

    async deleteUserExtraATokens(connection: Connection, user: User, limit: number, throwOnFailure: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Deleting all a-tokens except last ${limit} of user "${user}"...`
                                                    : `Deleting all a-tokens except last ${limit} of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, throwOnFailure)

        if (id == null)
            return 0

        const count = await this.getUserATokenCount(connection, user)

        if (limit >= count) {
            this.logger?.debug("Limit isn't exceeded")
            return 0
        }

        const diff = count - limit

        const [result] = await connection.execute(
            `DELETE FROM ATokens WHERE user_id = ? ORDER BY cr_time ASC LIMIT ${diff}`,
            [id]
        ) as [ResultSetHeader, FieldPacket[]]

        const deleted = result.affectedRows

        this.logger?.debug(`Deleted (${deleted})`)

        return deleted
    }

    async forceGetUserATokenCount(connection: Connection, user: User): Promise<number> {
        return await this.getUserATokenCount(connection, user, true)
    }

    async getUserATokenCount(connection: Connection, user: User, throwOnFailure: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Getting a-tokens count of user "${user}"...`
                                                    : `Getting a-tokens count of user with id ${user}...`)
        
        const id = await this.userManager.getUserId(connection, user, throwOnFailure)

        if (id == null)
            return 0
        
        const [rows] = await connection.execute("SELECT COUNT(*) AS count FROM ATokens WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]
        const count  = rows[0].count

        this.logger?.debug(`Got: ${count}`)

        return count
    }

    async checkATokenIsActive(connection: Connection, tokenId: ATokenInfo | Buffer | undefined | null) {
        if (!await this.isATokenActive(connection, tokenId))
            throw new TokenExpiredError()
    }

    async isATokenActive(connection: Connection, tokenId: ATokenInfo | Buffer | undefined | null): Promise<boolean> {
        const info = tokenId instanceof Buffer ? await this.getATokenInfo(connection, tokenId)
                                               : tokenId

        return info     != null 
            && info.exp >  new Date()
    }

    async forceCreateTokenPair(connection: Connection, user: User): Promise<TokenPair> {
        return await this.createTokenPair(connection, user, true)
    }

    async createTokenPair(connection: Connection, user: User, throwOnFailure:  true):            Promise<TokenPair>
    async createTokenPair(connection: Connection, user: User, throwOnFailure?: boolean):         Promise<TokenPair | undefined>
    async createTokenPair(connection: Connection, user: User, throwOnFailure:  boolean = false): Promise<TokenPair | undefined> {
        this.logger?.debug(typeof user === "string" ? `Creating token pair for user "${user}"...`
                                                    : `Creating token pair for user with id ${user}...`)
        
        const id = await this.userManager.getUserId(connection, user, throwOnFailure)

        if (id == null)
            return undefined

        const aTokenId  = createTokenId()
        const aTokenExp = dateMillisecondsAhead(this.config.logicATokenLifetime)

        await connection.execute(
            "INSERT INTO ATokens (id, user_id, exp_time) VALUES (?, ?, ?)",
            [aTokenId, id, aTokenExp]
        ) as [ResultSetHeader, FieldPacket[]]

        const rTokenId  = createTokenId()
        const rTokenExp = dateMillisecondsAhead(this.config.logicRTokenLifetime)

        await connection.execute(
            "INSERT INTO RTokens (id, atoken_id, exp_time) VALUES (?, ?, ?)",
            [rTokenId, aTokenId, rTokenExp]
        )

        const pair = {
            access: {
                id:  aTokenId,
                exp: aTokenExp
            },

            refresh: {
                id:  rTokenId,
                exp: rTokenExp
            }
        }

        this.logger?.debug(`Created: ${tokenPairToString(pair)}`)

        return pair
    }

    async forceDeleteAllUserATokens(connection: Connection, user: User): Promise<number> {
        return await this.deleteAllUserATokens(connection, user, true)
    }

    async deleteAllUserATokens(connection: Connection, user: User, throwOnFailure: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Deleting all a-tokens of user "${user}"...`
                                                    : `Deleting all a-tokens of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, throwOnFailure)

        if (id == null)
            return 0

        const [result] = await connection.execute("DELETE FROM ATokens WHERE user_id = ?", [id]) as [ResultSetHeader, FieldPacket[]]
        const count    = result.affectedRows

        this.logger?.debug(`Deleted (${count})`)

        return count
    }

    async deleteAllATokens(connection: Connection): Promise<number> {
        this.logger?.debug("Deleting all a-tokens...")

        const [result] = await connection.execute("DELETE FROM ATokens") as [ResultSetHeader, FieldPacket[]]
        const count    = result.affectedRows

        this.logger?.debug(`Deleted (${count})`)

        return count
    }

    async forceDeleteAToken(connection: Connection, aTokenId: Buffer) {
        await this.deleteAToken(connection, aTokenId, true)
    }

    async deleteAToken(connection: Connection, aTokenId: Buffer, throwOnFailure:  true):            Promise<true>
    async deleteAToken(connection: Connection, aTokenId: Buffer, throwOnFailure?: boolean):         Promise<boolean>
    async deleteAToken(connection: Connection, aTokenId: Buffer, throwOnFailure:  boolean = false): Promise<boolean> {
        this.logger?.debug(`Deleting a-token with id ${aTokenId.toString("hex")}...`)

        checkTokenId(aTokenId)
    
        const [result] = await connection.execute("DELETE FROM ATokens WHERE id = ?", [aTokenId]) as [ResultSetHeader, FieldPacket[]]

        if (result.affectedRows === 0) {
            const message = TokenNotFoundError.makeMessage(aTokenId)

            if (throwOnFailure)
                throw new TokenNotFoundError(aTokenId, message)

            this.logger?.debug(message)

            return false
        }

        this.logger?.debug("Deleted")

        return true
    }

    async forceGetATokenInfo(connection: Connection, aTokenId: Buffer): Promise<ATokenInfo> {
        return await this.getATokenInfo(connection, aTokenId, true)
    }

    async getATokenInfo(connection: Connection, aTokenId: Buffer, throwOnFailure:  true):            Promise<ATokenInfo>
    async getATokenInfo(connection: Connection, aTokenId: Buffer, throwOnFailure?: boolean):         Promise<ATokenInfo | undefined>
    async getATokenInfo(connection: Connection, aTokenId: Buffer, throwOnFailure:  boolean = false): Promise<ATokenInfo | undefined> {
        this.logger?.debug(`Getting info of a-token with id ${aTokenId.toString("hex")}...`)

        checkTokenId(aTokenId)

        const [rows] = await connection.execute("SELECT * FROM ATokens WHERE id = ?", [aTokenId]) as [ATokenRow[], FieldPacket[]]

        if (rows.length === 0) {
            const message = TokenNotFoundError.makeMessage(aTokenId)

            if (throwOnFailure)
                throw new TokenNotFoundError(aTokenId, message)

            this.logger?.debug(message)
            
            return undefined
        }

        const info = aTokenRowToInfo(rows[0])

        this.logger?.debug(`Got: ${aTokenInfoToString(info)}`)

        return info
    }

    async forceGetRTokenInfo(connection: Connection, rTokenId: Buffer): Promise<RTokenInfo> {
        return await this.getRTokenInfo(connection, rTokenId, true)
    }

    async getRTokenInfo(connection: Connection, rTokenId: Buffer, throwOnFailure:  true):            Promise<RTokenInfo>
    async getRTokenInfo(connection: Connection, rTokenId: Buffer, throwOnFailure?: boolean):         Promise<RTokenInfo | undefined>
    async getRTokenInfo(connection: Connection, rTokenId: Buffer, throwOnFailure:  boolean = false): Promise<RTokenInfo | undefined> {
        this.logger?.debug(`Getting info of r-token with id ${rTokenId.toString("hex")}...`)

        checkTokenId(rTokenId)

        const [rows] = await connection.execute("SELECT * FROM RTokens WHERE id = ?", [rTokenId]) as [RTokenRow[], FieldPacket[]]

        if (rows.length === 0) {
            const message = TokenNotFoundError.makeMessage(rTokenId)

            if (throwOnFailure)
                throw new TokenNotFoundError(rTokenId, message)

            this.logger?.debug(message)
            
            return undefined
        }

        const info = rTokenRowToInfo(rows[0])

        this.logger?.debug(`Got: ${rTokenInfoToString(info)}`)

        return info
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
        access:  tokenToJson(tokenPair.access),
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

export function aTokenRowToInfo(row: ATokenRow): ATokenInfo {
    return {
        id:      row.id,
        userId:  row.user_id,
        exp:     row.exp_time,
        created: row.cr_time
    }
}

export function rTokenRowToInfo(row: RTokenRow): RTokenInfo {
    return {
        id:       row.id,
        aTokenId: row.atoken_id,
        exp:      row.exp_time,
        created:  row.cr_time
    }
}

export function aTokenInfoToString(info: ATokenInfo): string {
    const json = {
        id:      info.id.toString("hex"),
        userId:  info.userId,
        exp:     info.exp.toISOString(),
        created: info.created.toISOString()
    }

    return JSON.stringify(json, null, 4)
}

export function rTokenInfoToString(info: RTokenInfo): string {
    const json = {
        id:       info.id.toString("hex"),
        aTokenId: info.aTokenId.toString("hex"),
        exp:      info.exp.toISOString(),
        created:  info.created.toISOString()
    }

    return JSON.stringify(json, null, 4)
}

export function createTokenId(): Buffer {
    const id      = crypto.randomBytes(64)
    const seconds = Date.now() / 1000

    id.writeUInt32BE(seconds, id.length - 4)

    return id
}

export function tokenToString(token: Token): string {
    const json = {
        id: token.id,
        exp: token.exp?.toISOString() ?? null
    }

    return JSON.stringify(json, null, 4)
}

export function tokenPairToString(pair: TokenPair): string {
    const { access, refresh } = pair

    const json = {
        access: {
            id:  access.id.toString("hex"),
            exp: access.exp?.toISOString() ?? null
        },

        refresh: {
            id:  refresh.id.toString("hex"),
            exp: refresh.exp?.toISOString() ?? null
        }
    }

    return JSON.stringify(json, null, 4)
}