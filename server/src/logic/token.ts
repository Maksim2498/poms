import Config                                                      from "Config"
import LogicError                                                  from "./LogicError"
import TokenExpiredError                                           from "./TokenExpiredError"
import TokenNotFoundError                                          from "./TokenNotFoundError"

import { Connection, FieldPacket, RowDataPacket, ResultSetHeader } from "mysql2/promise"
import { Logger                                                  } from "winston"
import { UserManager, User                                       } from "./user"

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
    deleteUserExtraATokens(connection: Connection, user: User, limit: number, checkUser?: boolean): Promise<number>

    forceGetUserATokenCount(connection: Connection, user: User): Promise<number>

    getUserATokenCount(connection: Connection, user: User, checkUser?: boolean): Promise<number>

    checkATokenIsActive(connection: Connection, tokenId: ATokenInfo | Buffer | undefined | null): Promise<void>

    isATokenActive(connection: Connection, tokenId: ATokenInfo | Buffer | undefined | null): Promise<boolean>

    createTokenPair(connection: Connection, user: User): Promise<TokenPair>

    deleteAllUserATokens(connection: Connection, user: User, checkUser?: boolean): Promise<number>

    forceDeleteAllUserATokens(connection: Connection, user: User): Promise<number>

    deleteAllATokens(connection: Connection): Promise<number>

    forceDeleteAToken(connection: Connection, aTokenId: Buffer): Promise<void>

    deleteAToken(connection: Connection, aTokenId: Buffer, force:  true):    Promise<true>
    deleteAToken(connection: Connection, aTokenId: Buffer, force?: boolean): Promise<boolean>

    forceGetATokenInfo(connection: Connection, aTokenId: Buffer): Promise<ATokenInfo>

    getATokenInfo(connection: Connection, aTokenId: Buffer, force:  true):    Promise<ATokenInfo>
    getATokenInfo(connection: Connection, aTokenId: Buffer, force?: boolean): Promise<ATokenInfo | undefined>

    forceGetRTokenInfo(connection: Connection, rTokenId: Buffer): Promise<RTokenInfo>

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
        this.logger?.debug(typeof user === "string" ? `Deleting all a-tokens except last ${limit} of user "${user}"...`
                                                    : `Deleting all a-tokens except last ${limit} of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null) {
            this.logger?.debug("Not found")
            return 0
        }

        const count = await this.getUserATokenCount(connection, user)

        if (limit >= count) {
            this.logger?.debug("Limit isn't exceeded")
            return 0
        }

        const diff = count - limit

        const [result] = await connection.execute(
            "DELETE FROM ATokens WHERE user_id = ? ORDER BY cr_time ASC LIMIT ?",
            [id, diff, diff]
        ) as [ResultSetHeader, FieldPacket[]]

        const deleted = result.affectedRows

        this.logger?.debug(`Deleted (${deleted})`)

        return deleted
    }

    async forceGetUserATokenCount(connection: Connection, user: User): Promise<number> {
        return await this.getUserATokenCount(connection, user, true)
    }

    async getUserATokenCount(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Getting a-tokens count of user "${user}"...`
                                                    : `Getting a-tokens count of user with id ${user}...`)
        
        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null) {
            this.logger?.debug("Not found")
            return 0
        }
        
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
        const info = tokenId instanceof Buffer ?  await this.getATokenInfo(connection, tokenId)
                                               : tokenId

        return info != null && info.exp > new Date()
    }

    async createTokenPair(connection: Connection, user: User): Promise<TokenPair> {
        // TODO
        return {} as TokenPair
    }

    async deleteAllUserATokens(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Deleting all a-tokens of user "${user}"...`
                                                    : `Deleting all a-tokens of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null) {
            this.logger?.debug("Not found")
            return 0
        }

        const [result] = await connection.execute("DELETE FROM ATokens WHERE user_id = ?", [id]) as [ResultSetHeader, FieldPacket[]]
        const count    = result.affectedRows

        this.logger?.debug(`Deleted (${count})`)

        return count
    }

    async forceDeleteAllUserATokens(connection: Connection, user: User): Promise<number> {
        return await this.deleteAllUserATokens(connection, user, true)
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

    async deleteAToken(connection: Connection, aTokenId: Buffer, force:  true):            Promise<true>
    async deleteAToken(connection: Connection, aTokenId: Buffer, force?: boolean):         Promise<boolean>
    async deleteAToken(connection: Connection, aTokenId: Buffer, force:  boolean = false): Promise<boolean> {
        this.logger?.debug(`Deleting a-token with id ${aTokenId.toString("hex")}...`)

        checkTokenId(aTokenId)
    
        const [result] = await connection.execute("DELETE FROM ATokens WHERE id = ?", [aTokenId]) as [ResultSetHeader, FieldPacket[]]

        if (result.affectedRows === 0) {
            if (force)
                throw new TokenNotFoundError(aTokenId)

            this.logger?.debug("Not found")

            return false
        }

        this.logger?.debug("Deleted")

        return true
    }

    async forceGetATokenInfo(connection: Connection, aTokenId: Buffer): Promise<ATokenInfo> {
        return await this.getATokenInfo(connection, aTokenId, true)
    }

    async getATokenInfo(connection: Connection, aTokenId: Buffer, force:  true):            Promise<ATokenInfo>
    async getATokenInfo(connection: Connection, aTokenId: Buffer, force?: boolean):         Promise<ATokenInfo | undefined>
    async getATokenInfo(connection: Connection, aTokenId: Buffer, force:  boolean = false): Promise<ATokenInfo | undefined> {
        this.logger?.debug(`Getting info of a-token with id ${aTokenId.toString("hex")}...`)

        checkTokenId(aTokenId)

        const [rows] = await connection.execute("SELECT * FROM ATokens WHERE id = ?", [aTokenId]) as [ATokenRow[], FieldPacket[]]

        if (rows.length === 0) {
            if (force)
                throw new TokenNotFoundError(aTokenId)

            this.logger?.debug("Not found")
            
            return undefined
        }

        const info = aTokenRowToInfo(rows[0])

        this.logger?.debug(`Got: ${aTokenInfoToString(info)}`)

        return info
    }

    async forceGetRTokenInfo(connection: Connection, rTokenId: Buffer): Promise<RTokenInfo> {
        return await this.getRTokenInfo(connection, rTokenId, true)
    }

    async getRTokenInfo(connection: Connection, rTokenId: Buffer, force:  true):            Promise<RTokenInfo>
    async getRTokenInfo(connection: Connection, rTokenId: Buffer, force?: boolean):         Promise<RTokenInfo | undefined>
    async getRTokenInfo(connection: Connection, rTokenId: Buffer, force:  boolean = false): Promise<RTokenInfo | undefined> {
        this.logger?.debug(`Getting info of r-token with id ${rTokenId.toString("hex")}...`)

        checkTokenId(rTokenId)

        const [rows] = await connection.execute("SELECT * FROM RTokens WHERE id = ?", [rTokenId]) as [RTokenRow[], FieldPacket[]]

        if (rows.length === 0) {
            if (force)
                throw new TokenNotFoundError(rTokenId)

            this.logger?.debug("Not found")
            
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