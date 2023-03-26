import z from "zod"


export default class Token {
    static readonly JSON_SCHEMA = z.object({
        id:  z.string().regex(/^[0-9a-fA-F]{128}$/),
        exp: z.coerce.date()
    })

    static checkId(id: string) {
        const invalidReason = this.validateId(id)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateId(id: string): string | undefined {
        id = this.normId(id)

        const LENGTH = 128

        if (id.length !== LENGTH)
            return `Invalid token id length. Expected: ${LENGTH}. Got: ${id.length}`

        if (id.matchAll(/^[0-9a-f]*$/g) == null)
            return `Token id contains non-hex-digit characters: ${id}`

        return undefined
    }

    static fromJson(json: any): Token {
        const { id, exp } = this.JSON_SCHEMA.parse(json)

        return new Token(id, exp)
    }

    static normId(id: string): string {
        return id.trim()
                 .toLowerCase()
    }

    readonly id:  string
    readonly exp: Date

    constructor(id: string, exp: Date) {
        Token.checkId(id)

        this.id  = Token.normId(id)
        this.exp = new Date(exp)
    }
}