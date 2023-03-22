import LogicError from "./LogicError"

export default class TokenNotFoundError extends LogicError {
    readonly token: Buffer

    constructor(token: Buffer) {
        super(`Token with id ${token.toString("hex")} not found`)
        this.token = token
    }
}