import LogicError from "./LogicError"

export default class TokenNotFoundError extends LogicError {
    readonly token: Buffer

    static makeMessage(token: Buffer): string {
        return `Token with id ${token.toString("hex")} not found`
    }

    constructor(token: Buffer, message: string = TokenNotFoundError.makeMessage(token)) {
        super(message)
        this.token = token
    }
}