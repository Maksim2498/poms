import Token from "./Token";

export default class TokenPair {
    readonly access:  Token
    readonly refresh: Token

    constructor(access: Token, refresh: Token) {
        this.access  = access
        this.refresh = refresh
    }
}