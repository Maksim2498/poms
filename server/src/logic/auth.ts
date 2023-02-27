import AsyncConnection from "util/mysql/AsyncConnection"
import LogicError      from "./LogicError"

import { getUserIdByCredentials } from "./user"

import * as t from "./token"

export async function auth(connection: AsyncConnection, login: string, password: string, options: t.LifeTimeOptions = t.DEFAULT_LIFETIME_OPTIONS): Promise<t.TokenPair> {
    const userId = await getUserIdByCredentials(connection, login, password)
    return await t.createTokenPair(connection, userId, options)
}

export async function reauth(connection: AsyncConnection, rTokenId: Buffer, options: t.LifeTimeOptions = t.DEFAULT_LIFETIME_OPTIONS): Promise<t.TokenPair> {
    const rTokenInfo = await t.getRTokenInfo(connection, rTokenId, true)

    if (rTokenInfo.exp <= new Date())
        throw new LogicError("Token is too old")

    const aTokenInfo = await t.getATokenInfo(connection, rTokenInfo.aTokenId, true)
    
    await t.deleteAToken(connection, aTokenInfo.id) // Refresh token will be deleted cascade
    
    return await t.createTokenPair(connection, aTokenInfo.userId, options)
}