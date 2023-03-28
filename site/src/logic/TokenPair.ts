import z           from "zod"
import Cookies     from "js-cookie";
import Token       from "./Token";

import { maxDate } from "util/date";

export interface CreationOptions {
    readonly access:  Token
    readonly refresh: Token
}

export default class TokenPair {
    static readonly COOKIE_NAME = "token-pair"
    static readonly COOKIE_SEP  = "&"

    static readonly JSON_SCHEMA = z.object({
        access:  Token.JSON_SCHEMA,
        refresh: Token.JSON_SCHEMA
    })

    static fromJson(json: any): TokenPair {
        const {
            access: {
                id:  accessId,
                exp: accessExp
            },
            refresh: {
                id:  refreshId,
                exp: refreshExp
            }
        } = this.JSON_SCHEMA.parse(json)

        const access  = new Token(accessId, accessExp)
        const refresh = new Token(refreshId, refreshExp)

        return new TokenPair({ access, refresh })
    }

    static remove() {
        Cookies.remove(this.COOKIE_NAME, { sameSite: "strict" })
    }

    static load(): TokenPair {
        const pair = this.safeLoad()

        if (pair == null)
            throw new Error("Failed to load token pair")

        return pair
    }

    static safeLoad(): TokenPair | undefined {
        const cookie = Cookies.get(TokenPair.COOKIE_NAME)

        if (!cookie)
            return undefined

        const splits = cookie.split(TokenPair.COOKIE_SEP)

        if (splits.length !== 4) {
            TokenPair.remove()
            return undefined
        }

        const [accessId, accessExp, refreshId, refreshExp] = splits

        try {
            const pair = TokenPair.fromJson({
                access:  {
                    id:  accessId,
                    exp: accessExp
                },
                refresh: {
                    id:  refreshId,
                    exp: refreshExp
                }
            })

            return pair
        } catch (error) {
            console.log(error)
            TokenPair.remove()
            return undefined
        }
    }

    readonly access:  Token
    readonly refresh: Token

    constructor(options: CreationOptions) {
        this.access  = options.access
        this.refresh = options.refresh
    }

    save() {
        Cookies.set(TokenPair.COOKIE_NAME, tokenPairToValue(this), {
            expires:  maxDate(this.access.exp, this.refresh.exp),
            sameSite: "strict"
        })

        function tokenPairToValue(pair: TokenPair) {
            return tokenToValue(pair.access) + TokenPair.COOKIE_SEP + tokenToValue(pair.refresh)

            function tokenToValue(token: Token) {
                return token.id + TokenPair.COOKIE_SEP + token.exp.toISOString()
            }
        }
    }

    get accessExpired(): boolean {
        return this.access.exp <= new Date()
    }

    get refreshExpired(): boolean {
        return this.refresh.exp <= new Date()
    }
}