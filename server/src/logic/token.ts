import crypto          from "crypto"
import AsyncConnection from "util/mysql/AsyncConnection"
import LogicError      from "./LogicError"

import { A_TOKENS_TABLE, R_TOKENS_TABLE } from "db-schema"
import { deleteAllUserData, User        } from "./user"
import { dateSecondsAhead               } from "util/date"

export interface LifeTimeOptions {
    accessLifeTime?:  number
    refreshLifeTime?: number
}

export const DEFAULT_LIFETIME_OPTIONS: LifeTimeOptions = {
    accessLifeTime:  30 * 60,          // 30 minutes
    refreshLifeTime: 7  * 24 * 60 * 60 // 1  weak
}

export interface TokenPair {
    id:      Token
    refresh: Token
}

export interface Token {
    id:   Buffer
    exp?: Date
}

export async function createTokenPair(connection: AsyncConnection, userId: number, options: LifeTimeOptions = DEFAULT_LIFETIME_OPTIONS): Promise<TokenPair> {
    const aTokenId  = createTokenId()
    const aTokenExp = dateSecondsAhead(options.accessLifeTime)
    const rTokenId  = createTokenId()
    const rTokenExp = dateSecondsAhead(options.refreshLifeTime)

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

export function createTokenId(): Buffer {
    const id = crypto.randomBytes(64)
    id.writeUInt32BE(Date.now() / 1000, id.length - 4)
    return id
}

export interface TokenPairJson {
    access:  TokenJson
    refresh: TokenJson
}

export function tokenPairToJson(tokenPair: TokenPair): TokenPairJson {
    return {
        access:  tokenToJson(tokenPair.id),
        refresh: tokenToJson(tokenPair.refresh)
    }
}

export interface TokenJson {
    id:   string
    exp?: string
}

export function tokenToJson(token: Token): TokenJson {
    return {
        id:  token.id.toString("hex"),
        exp: token.exp?.toISOString()
    }
}

export async function deleteAllATokens(connection: AsyncConnection, user?: User) {
    await deleteAllUserData(connection, A_TOKENS_TABLE, user)
}

export async function deleteAllRTokens(connection: AsyncConnection, user?: User) {
    await deleteAllUserData(connection, R_TOKENS_TABLE, user)
}

export async function deleteRToken(conneciton: AsyncConnection, rToken: Buffer) {
    checkToken(rToken)
    await R_TOKENS_TABLE.delete(conneciton).where("id = ?", rToken)
}

export async function deleteAToken(conneciton: AsyncConnection, aToken: Buffer) {
    checkToken(aToken)
    await A_TOKENS_TABLE.delete(conneciton).where("id = ?", aToken)
}

export interface ATokenInfo {
    id:       Buffer
    userId:   number
    exp:      Date
    creation: Date
}

export async function getATokenInfo(connection: AsyncConnection, aTokenId: Buffer, force: true): Promise<ATokenInfo>
export async function getATokenInfo(connection: AsyncConnection, aTokenId: Buffer, force?: false): Promise<ATokenInfo | undefined>
export async function getATokenInfo(connection: AsyncConnection, aTokenId: Buffer, force: boolean = false): Promise<ATokenInfo | undefined> {
    checkToken(aTokenId)

    const results = await A_TOKENS_TABLE.select(connection).where("id = ?", aTokenId)

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

export interface RTokenInfo {
    id:       Buffer
    aTokenId: Buffer
    exp:      Date
    creation: Date
}

export async function getRTokenInfo(conneciton: AsyncConnection, rTokenId: Buffer, force: true): Promise<RTokenInfo>
export async function getRTokenInfo(conneciton: AsyncConnection, rTokenId: Buffer, force?: false): Promise<RTokenInfo | undefined>
export async function getRTokenInfo(conneciton: AsyncConnection, rTokenId: Buffer, force: boolean = false): Promise<RTokenInfo | undefined> {
    checkToken(rTokenId)

    const results = await R_TOKENS_TABLE.select(conneciton).where("id = ?", rTokenId)

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
        creation: cr_time
    }
}

export function checkToken(rToken: Buffer) {
    const invalidReason = validateToken(rToken)

    if (invalidReason !== undefined)
        throw new LogicError(invalidReason)
}

export function validateToken(tokenId: Buffer): string | undefined {
    const LENGTH = 64

    if (tokenId.length !== LENGTH)
        return `Invalid token length. Expected: ${LENGTH}. Got: ${tokenId.length}`

    return undefined
}