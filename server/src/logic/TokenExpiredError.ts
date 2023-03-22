import LogicError from "./LogicError";

export default class TokenExpiredError extends LogicError {
    constructor() {
        super("Unregistered or expired token")
    }
}