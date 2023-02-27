import Cookies from "js-cookie"

import { isHex } from "util/string"

export interface TokenPairJson {
    access:  TokenJson
    refresh: TokenJson
}

export interface TokenPair {
    access:  Token
    refresh: Token
}

export function tokenPairFromJson(json: TokenPairJson): TokenPair {
    return {
        access:  tokenFromJson(json.access),
        refresh: tokenFromJson(json.refresh)
    }
}

export interface TokenJson {
    id:  string
    exp: string
}

export interface Token {
    id:  string
    exp: Date
}

export function tokenFromJson(json: TokenJson): Token {
    checkTokenId(json.id)

    const date = new Date(json.exp)

    checkTokenDate(date)

    return {
        id:  json.id,
        exp: date
    }
}

export function saveTokenPairJsonToCookies(json: TokenPairJson) {
    saveTokenPairToCookies(tokenPairFromJson(json))
}

export const COOKIE_NAME = "tokens"
export const COOKIE_SEP  = "&"

export function saveTokenPairToCookies(pair: TokenPair) {
    Cookies.set(COOKIE_NAME, tokenPairToValue(pair), {
        expires:  maxDate(pair.access.exp, pair.refresh.exp),
        sameSite: "strict"
    })

    function maxDate(lhs: Date, rhs: Date): Date {
        return lhs >= rhs ? lhs : rhs
    }

    function tokenPairToValue(pair: TokenPair): string {
        return tokenToValue(pair.access) + COOKIE_SEP + tokenToValue(pair.refresh)
    }

    function tokenToValue(token: Token): string {
        return token.id + COOKIE_SEP + token.exp.toISOString()
    }
}

export function readTokenPairFromCookies(): TokenPair | undefined {
    const cookie = Cookies.get(COOKIE_NAME)

    if (!cookie)
        return undefined

    const splits = cookie.split(COOKIE_SEP)

    if (splits.length !== 4)
        return undefined

    const [accessId, accessExpString, refreshId, refreshExpString] = splits

    const accessExp  = new Date(accessExpString)
    const refreshExp = new Date(refreshExpString)

    if (validateTokenId(accessId)
     || validateTokenDate(accessExp)
     || validateTokenId(refreshId)
     || validateTokenDate(refreshExp))
     return undefined

    return {
        access: {
            id:  accessId,
            exp: accessExp
        },
        refresh: {
            id:  refreshId,
            exp: refreshExp
        }
    }
}

export function checkTokenDate(date: Date) {
    const invalidReason = validateTokenDate(date)

    if (invalidReason !== undefined)
        throw new Error(invalidReason)
}

export function validateTokenDate(date: Date): string | undefined {
    if (Number.isNaN(date.valueOf()))
        return "Invalid date"

    return undefined
}

export function checkTokenId(id: string) {
    const invalidReason = validateTokenId(id)

    if (invalidReason !== undefined)
        throw new Error(invalidReason)
}

export function validateTokenId(id: string): string | undefined {
    if (!isHex(id))
        return `Token id "${id}"(${id.length}) contains illegal characters`

    const LENGTH = 128

    if (id.length !== LENGTH)
        return `Token id "${id}"(${id.length}) is of invalid length. Exactly ${LENGTH} characters required`

    return undefined
}