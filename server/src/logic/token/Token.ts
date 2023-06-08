import crypto                                                        from "crypto"
import z                                                             from "zod"
import parseDuration                                                 from "parse-duration"
import LogicError                                                    from "logic/LogicError"
import BufferWritable                                                from "util/buffer/BufferWritable"
import ReadonlyDate                                                  from "util/date/ReadonlyDate"

import { checkBufferSize, readDate, writeDate, BYTE_LENGTH_OF_DATE } from "util/buffer/buffer"
import { isInvalid                                                 } from "util/date/date"
import { isHex                                                     } from "util/string"

export interface TokenOptions {
    readonly accessId?:       string | Buffer
    readonly refreshId?:      string | Buffer
    readonly created?:        Date
    readonly accessExpires?:  Date
    readonly refreshExpires?: Date
    readonly dontCheck?:      boolean
}

export type TokenJSON         = z.infer<typeof Token.JSON_SCHEMA>
export type ReadonlyTokenJSON = Readonly<TokenJSON>

/*
    Buffer structure:

    struct Date; // See util/buffer.ts

    struct Token {                  // Offset   Accumulated Size
        char        accessId[64];   // 0        64
        char        refreshId[64];  // 64       128
        struct Date created;        // 128      136
        struct Date accessExpires;  // 136      144
        struct Date refreshExpires; // 144      152
    };
*/

export default class Token implements BufferWritable {
    static readonly DEFAULT_ACCESS_LIFETIME  = parseDuration("30m")
    static readonly DEFAULT_REFRESH_LIFETIME = parseDuration("1w")

    static readonly ID_JSON_SCHEMA = z.string().transform((id, ctx) => {
        const invalidReason = Token.validateId(id)

        if (invalidReason == null)
            return id

        ctx.addIssue({
            code:    "custom",
            message: "Invalid token id",
        })

        return z.NEVER
    })

    static readonly JSON_SCHEMA = z.object({
        accessId:       Token.ID_JSON_SCHEMA,
        refreshId:      Token.ID_JSON_SCHEMA,
        created:        z.string().datetime(),
        accessExpires:  z.string().datetime(),
        refreshExpires: z.string().datetime(),
    }).superRefine((json, ctx) => {
        const created        = new Date(json.created)
        const accessExpires  = new Date(json.accessExpires)
        const refreshExpires = new Date(json.refreshExpires)

        if (accessExpires < created || refreshExpires < created)
            ctx.addIssue({
                code:    "custom",
                message: "Token cannot expire before it's creation",
            })
    })

    static readonly BYTE_LENGTH_OF_ID = 64
    static readonly BYTE_LENGTH       = 2 * this.BYTE_LENGTH_OF_ID
                                      + 3 * BYTE_LENGTH_OF_DATE

    static readonly ID_LENGTH = 128

    static fromJSON(json: unknown): Token {
        const parsed = Token.JSON_SCHEMA.parse(json)
        return Token.fromParsedJSON(parsed)
    }

    static fromParsedJSON(json: ReadonlyTokenJSON): Token {
        const {
            accessId,
            refreshId,
        } = json

        const created        = new Date(json.created)
        const accessExpires  = new Date(json.accessExpires)
        const refreshExpires = new Date(json.refreshExpires)

        return new Token({
            dontCheck: true,
            accessId,
            refreshId,
            created,
            accessExpires,
            refreshExpires,
        })
    }

    static fromBuffer(buffer: Buffer, offset: number = 0, dontCheck: boolean = false): Token {
        checkBufferSize(buffer, Token.BYTE_LENGTH + offset)

        let nextOffset: number

        nextOffset = offset + Token.BYTE_LENGTH_OF_ID
        const accessId  = buffer.toString("hex", offset, nextOffset)
        offset = nextOffset

        nextOffset = offset + Token.BYTE_LENGTH_OF_ID
        const refreshId = buffer.toString("hex", offset, nextOffset)
        offset = nextOffset

        const created = readDate(buffer, offset)
        offset += BYTE_LENGTH_OF_DATE

        const accessExpires = readDate(buffer, offset)
        offset += BYTE_LENGTH_OF_DATE

        const refreshExpires = readDate(buffer, offset)

        return new Token({
            accessId,
            refreshId,
            created,
            accessExpires,
            refreshExpires,
            dontCheck
        })
    }

    static checkId(id: string) {
        const invalidReason = Token.validateId(id)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validateId(id: string): string | undefined {
        if (id.length !== Token.ID_LENGTH)
            return `Invalid token id length. Expected: ${Token.ID_LENGTH}. Got: ${id.length}`

        if (!isHex(id))
            return `Token id must be a hex string`

        return undefined
    }

    readonly accessId:       string
    readonly refreshId:      string
    readonly created:        ReadonlyDate
    readonly accessExpires:  ReadonlyDate
    readonly refreshExpires: ReadonlyDate

    constructor(options: TokenOptions = {}) {
        const accessId       = prepareId(options.accessId)
        const refreshId      = prepareId(options.refreshId)
        const created        = options.created != null ? new Date(options.created) : new Date()
        const accessExpires  = new Date(options.accessExpires  ?? Token.DEFAULT_ACCESS_LIFETIME )
        const refreshExpires = new Date(options.refreshExpires ?? Token.DEFAULT_REFRESH_LIFETIME)
        const dontCheck      = options.dontCheck

        if (!dontCheck) {
            if (accessExpires < created || refreshExpires < created)
                throw new Error("Token cannot expire before it's creation")

            if (isInvalid(created))
                throw new Error("Creation date is invalid")

            if (isInvalid(accessExpires))
                throw new Error("Access expiration date is invalid")

            if (isInvalid(refreshExpires))
                throw new Error("Refresh expiration date is invalid")
        }

        this.accessId       = accessId
        this.refreshId      = refreshId
        this.created        = created
        this.accessExpires  = accessExpires
        this.refreshExpires = refreshExpires

        function prepareId(id: string | Buffer | undefined): string {
            switch (typeof id) {
                case "string":
                    id = id.toLowerCase()
                    break

                case "object":
                    id = id.toString("hex")
                    break

                case "undefined":
                    id = crypto.randomBytes(Token.BYTE_LENGTH_OF_ID)
                               .toString("hex")
            }

            Token.checkId(id)

            return id
        }
    }

    get byteLength(): number {
        return Token.BYTE_LENGTH
    }

    toString(): string {
        return JSON.stringify(this.toJSON(), null, 4)
    }

    toJSON(): TokenJSON {
        const {
            accessId,
            refreshId,
        } = this

        const created        = this.created.toJSON()
        const accessExpires  = this.accessExpires.toJSON()
        const refreshExpires = this.refreshExpires.toJSON()

        return {
            accessId,
            refreshId,
            created,
            accessExpires,
            refreshExpires,
        }
    }

    toBuffer(): Buffer {
        const buffer = Buffer.alloc(Token.BYTE_LENGTH)
        this.writeToBuffer(buffer)
        return buffer
    }

    writeToBuffer(buffer: Buffer, offset: number = 0): number {
        checkBufferSize(buffer, this.byteLength + offset)

        offset += buffer.write(this.accessId,  offset, "hex")
        offset += buffer.write(this.refreshId, offset, "hex")

        offset  = writeDate(buffer, this.created,        offset)
        offset  = writeDate(buffer, this.accessExpires,  offset)
        offset  = writeDate(buffer, this.refreshExpires, offset)
        
        return offset
    }
}