import Cookies from "js-cookie"
import z       from "zod"

const tokenSchema = z.object({
    id:  z.string().regex(/^[0-9a-fA-F]{128}$/),
    exp: z.coerce.date()
})

export type Token = z.infer<typeof tokenSchema>

const tokenPairSchema = z.object({
    access:  tokenSchema,
    refresh: tokenSchema
})

export type TokenPair = z.infer<typeof tokenPairSchema>

export function tokenPairFromJson(json: any): TokenPair {
    return tokenPairSchema.parse(json)
}

export function tokenFromJson(json: any): Token {
    return tokenSchema.parse(json)
}

export function saveTokenPairJsonToCookies(json: any) {
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

    if (splits.length !== 4) {
        removeTokenPairFromCookies()
        return undefined
    }

    const [accessId, accessExp, refreshId, refreshExp] = splits

    try {
        return tokenPairFromJson({
            access: {
                id:  accessId,
                exp: accessExp,
            },

            refresh: {
                id:  refreshId,
                exp: refreshExp
            }
        })
    } catch {
        removeTokenPairFromCookies()
        return undefined
    }
}

export function removeTokenPairFromCookies() {
    Cookies.remove(COOKIE_NAME, { sameSite: "strict" })
}