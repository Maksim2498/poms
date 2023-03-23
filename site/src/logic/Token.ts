export default class Token {
    static checkId(id: Buffer) {
        const invalidReason = this.validateId(id)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateId(id: Buffer): string | undefined {
        const LENGTH = 64

        if (id.length !== LENGTH)
            return `Invalid token length. Expected: ${LENGTH}. Got: ${id.length}`

        return undefined
    }

    readonly id:  Buffer
    readonly exp: Date

    constructor(id: Buffer, exp: Date) {
        Token.checkId(id)

        this.id  = Buffer.from(id)
        this.exp = new Date(exp)
    }
}