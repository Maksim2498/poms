import z                   from "zod"
import BufferWritable      from "util/buffer/BufferWritable"
import DeepReadonly        from "util/type/DeepReadonly"
import Token               from "./Token"

import { isUInt          } from "util/number"
import { checkBufferSize } from "util/buffer/buffer"

export interface TokenSetOptions {
    tokens?:    Iterable<Token>
    max?:       number
    dontCheck?: boolean
}

export type TokenSetJSON         = z.infer<typeof TokenSet.JSON_SCHEMA>
export type ReadonlyTokenSetJSON = DeepReadonly<TokenSetJSON>

/*
    Buffer structure:

    struct Token; // See ./Token.ts

    struct TokenSet {
        uint8_t      size;
        uint8_t      max;
        struct Token tokens[this.max];
    };
*/

export default class TokenSet implements Iterable<Token>, BufferWritable {
    static readonly DEFAULT_MAX         = 5
    static readonly MAX_MAX             = 255

    static readonly JSON_SCHEMA         = z.object({
        max:    z.number().int().nonnegative().max(TokenSet.MAX_MAX),
        tokens: Token.JSON_SCHEMA.array(),
    }).superRefine((json, ctx) => {
        const { max, tokens } = json

        if (tokens.length > max)
            ctx.addIssue({
                code:      "too_big",
                path:      ["tokens"],
                type:      "array",
                inclusive: true,
                maximum:   max,
            })
    })

    static readonly BYTE_LENGTH_OF_SIZE = 1 // uint8_t
    static readonly BYTE_LENGTH_OF_MAX  = 1 // uint8_t
    static readonly MIN_BYTE_LEGNTH     = this.BYTE_LENGTH_OF_SIZE
                                        + this.BYTE_LENGTH_OF_MAX

    static readonly OFFSET_OF_SIZE      = 0
    static readonly OFFSET_OF_MAX       = this.OFFSET_OF_SIZE

    static fromJSON(json: unknown): TokenSet {
        const parsed = TokenSet.JSON_SCHEMA.parse(json)
        return TokenSet.fromParsedJSON(parsed, true)
    }

    static fromParsedJSON(json: ReadonlyTokenSetJSON, dontCheck: boolean = false): TokenSet {
        const max    = json.max
        const tokens = json.tokens.map(json => Token.fromParsedJSON(json, dontCheck))

        return new TokenSet({
            dontCheck,
            tokens,
            max,
        })
    }

    static evalByteLength(max: number): number {
        return TokenSet.MIN_BYTE_LEGNTH + max * Token.BYTE_LENGTH
    }

    static fromBuffer(buffer: Buffer, offset: number = 0, dontCheck: boolean = false): TokenSet {
        checkBufferSize(buffer, offset + TokenSet.MIN_BYTE_LEGNTH)

        const size = buffer.readUInt8(offset++)
        const max  = buffer.readUInt8(offset++)

        checkBufferSize(buffer, offset + max * Token.BYTE_LENGTH)

        const tokens = Array<Token>()

        for (let i = 0; i < size; ++i) {
            const token = Token.fromBuffer(buffer, offset, dontCheck)
            tokens.push(token)
            offset += Token.BYTE_LENGTH
        }

        return new TokenSet({
            tokens,
            max,
            dontCheck
        })
    }

    static byteLengthFromBuffer(buffer: Buffer, offset: number = 0): number {
        const max = TokenSet.maxFromBuffer(buffer, offset)
        return TokenSet.evalByteLength(max)
    }

    static sizeFromBuffer(buffer: Buffer, offset: number = 0): number {
        return buffer.readUInt8(offset + TokenSet.OFFSET_OF_SIZE)
    }

    static maxFromBuffer(buffer: Buffer, offset: number = 0): number {
        return buffer.readUInt8(offset + TokenSet.OFFSET_OF_MAX)
    }

    private readonly tokens: Token[] = []
            readonly max:    number 

    constructor(options: TokenSetOptions = {}) {
        const tokens    = options.tokens ?? []
        const max       = options.max    ?? TokenSet.DEFAULT_MAX
        const dontCheck = options.dontCheck

        if (!dontCheck) {
            if (!isUInt(max))
                throw new Error("Maximum size has to be an unsigned integer")

            if (max > TokenSet.MAX_MAX)
                throw new Error(`Maximum size exceeds the limit (${TokenSet.MAX_MAX})`)
        }

        this.max = max

        for (const token of tokens)
            this.add(token)
    }

    get byteLength(): number {
        return TokenSet.evalByteLength(this.max)
    }

    get size(): number {
        return this.tokens.length
    }

    forEach(callback: (token: Token, set: this) => void, thisArg?: any) {
        for (const token of this.tokens)
            callback.call(thisArg, token, this)
    }

    add(token: Token): this {
        if (this.tokens.length >= this.max)
            this.deleteOldest()

        this.tokens.push(token)

        return this
    }

    deleteOldest(): boolean {
        if (this.tokens.length === 0)
            return false

        let valueOfOldestCreated = Number.POSITIVE_INFINITY
        let oldestIndex          = 0

        for (let i = 0; i < this.tokens.length; ++i) {
            const valueOdCreated = this.tokens[i]!.created.valueOf()

            if (valueOdCreated < valueOfOldestCreated) {
                valueOfOldestCreated = valueOdCreated
                oldestIndex          = i
            }
        }

        this.tokens.splice(oldestIndex, 1)

        return true
    }

    deleteByAccessId(id: string): boolean {
        return this.deleteById(id, "access")
    }

    deleteByRefreshId(id: string): boolean {
        return this.deleteById(id, "refresh")
    }

    private deleteById(id: string, type: "access" | "refresh"): boolean {
        id = Token.normId(id)

        Token.checkNormedId(id)

        let index = -1

        const key = `${type}Id` as "accessId" | "refreshId"

        for (const [i, token] of this.tokens.entries())
            if (token[key] === id) {
                index = i
                break
            }

        if (index === -1)
            return false

        this.tokens.splice(index, 1)

        return true
    }

    clear(): void {
        this.tokens.length = 0
    }

    values(): IterableIterator<Token> {
        return this.tokens.values()
    }

    [Symbol.iterator](): IterableIterator<Token> {
        return this.tokens[Symbol.iterator]()
    }

    toString(): string {
        return JSON.stringify(this.toJSON(), null, 4)
    }

    toJSON(): TokenSetJSON {
        return {
            max:    this.max,
            tokens: this.tokens.map(token => token.toJSON()),
        }
    }

    toArray(): Token[] {
        return [...this]
    }

    toBuffer(): Buffer {
        const buffer = Buffer.alloc(this.byteLength)
        this.writeToBuffer(buffer)
        return buffer
    }

    writeToBuffer(buffer: Buffer, offset: number = 0): number {
        const resultOffset = this.byteLength + offset

        checkBufferSize(buffer, resultOffset)

        offset = buffer.writeUInt8(this.size, offset)
        offset = buffer.writeUInt8(this.max,  offset)

        for (const token of this.tokens)
            offset = token.writeToBuffer(buffer, offset)

        return resultOffset
    }
}