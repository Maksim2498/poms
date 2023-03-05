import LogicError from "./LogicError"

export default class NeedAuthError extends LogicError {
    constructor(message: string = "Need to authenticate", cause?: any) {
        super(message, { cause })
    }
}