export default class NeedAuthError extends Error {
    constructor(message: string = "Need to authenticate", cause?: any) {
        super(message, { cause })
    }
}