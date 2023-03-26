import z     from "zod"
import Token from "./Token";

export default class TokenPair {
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

        return new TokenPair(access, refresh)
    }

    static remove() {

    }

    static load(): TokenPair {
        const pair = this.safeLoad()

        if (pair == null)
            throw new Error("Failed to load token pair")

        return pair
    }

    static safeLoad(): TokenPair | null {
        return null
    }

    readonly access:  Token
    readonly refresh: Token

    constructor(access: Token, refresh: Token) {
        this.access  = access
        this.refresh = refresh
    }

    save() {

    }
}