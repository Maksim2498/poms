import TokenPair from "./TokenPair"
import User      from "./User"

export default class AuthInfo {
    readonly user:      User
    readonly tokenPair: TokenPair

    constructor(user: User, tokenPair: TokenPair) {
        this.user      = user
        this.tokenPair = tokenPair
    }

    save() {

    }
}