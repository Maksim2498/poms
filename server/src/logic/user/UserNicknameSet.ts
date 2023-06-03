import LogicError                                                                       from "logic/LogicError"
import BufferWritable                                                                   from "util/BufferWritable"

import { checkBufferSize, writeTinyString, readTinyString, BYTE_LENGTH_OF_TINY_STRING } from "util/buffer"
import { hasWs, escape                                                                } from "util/string"
import { isUInt                                                                       } from "util/number"

export interface UserNicknameSetOptions {
    nicknames?: Iterable<string>
    max?:       number
    dontCheck?: boolean
}

export interface UserNicknameSetJSON {
    max:       number
    nicknames: string[]
}

/*
    Buffer structure:

    struct TinyString; // See util/buffer.ts

    struct UserNicknameSet {
        uint8_t           size;
        uint8_t           max;
        struct TinyString nicknames[this.max];
    };
*/

export default class UserNicknameSet implements Iterable<string>, BufferWritable {
    static readonly DEFAULT_MAX                 = 5
    static readonly MAX_MAX                     = 255

    static readonly MIN_BYTE_LENGTH_OF_NICKNAME = 4
    static readonly MAX_BYTE_LENGTH_OF_NICKNAME = 255

    static readonly BYTE_LENGTH_OF_SIZE         = 1 // uint8_t
    static readonly BYTE_LENGTH_OF_MAX          = 1 // uint8_t

    static readonly MIN_BYTE_LENGTH             = this.BYTE_LENGTH_OF_SIZE
                                                + this.BYTE_LENGTH_OF_MAX

    static fromBuffer(buffer: Buffer, offset: number = 0, dontCheck: boolean = false): UserNicknameSet {
        checkBufferSize(buffer, offset + UserNicknameSet.MIN_BYTE_LENGTH)

        const size = buffer.readUInt8(offset++)
        const max  = buffer.readUInt8(offset++)

        checkBufferSize(buffer, offset + max * BYTE_LENGTH_OF_TINY_STRING)

        const nicknames = new Array<string>()

        for (let i = 0; i < size; ++i) {
            const nickname = readTinyString(buffer, offset)
            nicknames.push(nickname)
            offset += BYTE_LENGTH_OF_TINY_STRING
        }

        return new UserNicknameSet({
            nicknames,
            max,
            dontCheck,
        })
    }

    static checkNickname(nickname: string) {
        const invalidReason = UserNicknameSet.validateNickname(nickname)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static checkNormedNickname(nickname: string) {
        const invalidReason = UserNicknameSet.validateNormedNickname(nickname)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validateNickname(nickname: string): string | undefined {
        return UserNicknameSet.validateNormedNickname(this.normNickname(nickname))
    }

    static validateNormedNickname(nickname: string): string | undefined {
        const length = Buffer.byteLength(nickname)

        if (length < UserNicknameSet.MIN_BYTE_LENGTH_OF_NICKNAME)
            return `Nickname "${escape(nickname)}" is too small. Minimum size expected: ${UserNicknameSet.MIN_BYTE_LENGTH_OF_NICKNAME}. Got: ${length}`

        if (length > UserNicknameSet.MAX_BYTE_LENGTH_OF_NICKNAME)
            return `Nickname "${escape(nickname)}" is too big. Maximum size expected: ${UserNicknameSet.MAX_BYTE_LENGTH_OF_NICKNAME}. Got: ${length}`

        if (hasWs(nickname))
            return `Nickname "${escape(nickname)}" contains whitespace`

        return undefined
    }

    static normNickname(nickname: string): string {
        return nickname.trim()
    }

    private  nicknames: Set<string> = new Set()
    readonly max:       number

    constructor(options: UserNicknameSetOptions) {
        let   nicknames = options.nicknames != null ? [...options.nicknames] : []
        const max       = options.max ?? UserNicknameSet.DEFAULT_MAX
        const dontCheck = options.dontCheck

        if (dontCheck) {
            if (nicknames.length > max)
                nicknames = nicknames.slice(0, max)
        } else {
            if (!isUInt(max))
                throw new Error("Maximum size has to be an unsigned integer")

            if (max > UserNicknameSet.MAX_MAX)
                throw new Error(`Maximum size exceeds the limit (${UserNicknameSet.MAX_MAX})`)

            if (nicknames.length > max)
                throw new LogicError("Too many nicknames")

            nicknames = nicknames.map(UserNicknameSet.normNickname)

            for (const nickname of nicknames)
                UserNicknameSet.checkNormedNickname(nickname)
        }

        this.max       = max
        this.nicknames = new Set(nicknames)
    }

    get byteLength(): number {
        return UserNicknameSet.MIN_BYTE_LENGTH + this.max * BYTE_LENGTH_OF_TINY_STRING
    }
    
    get size(): number {
        return this.nicknames.size
    }

    forEach(callback: (nickname: string, nicknames: UserNicknameSet) => void, thisArg?: any) {
        for (const nickname of this.nicknames)
            callback.call(thisArg, nickname, this)
    }

    has(nickname: string): boolean {
        nickname = UserNicknameSet.normNickname(nickname)
        return this.nicknames.has(nickname)
    }

    add(nickname: string): this {
        nickname = UserNicknameSet.normNickname(nickname)

        if (this.nicknames.has(nickname))
            return this

        UserNicknameSet.checkNormedNickname(nickname)

        if (this.nicknames.size >= this.max)
            throw new LogicError("Too many nicknames")

        this.nicknames.add(nickname)

        return this
    }

    clear(): void {
        this.nicknames.clear()
    }

    delete(nickname: string): boolean {
        nickname = UserNicknameSet.normNickname(nickname)
        return this.nicknames.delete(nickname)
    }

    values(): IterableIterator<string> {
        return this.nicknames.values()
    }

    [Symbol.iterator](): IterableIterator<string> {
        return this.nicknames[Symbol.iterator]()
    }

    toString(): string {
        return `[${this.toArray().join(", ")}] (${this.size}/${this.max})`
    }

    toJSON(): UserNicknameSetJSON {
        return {
            max:       this.max,
            nicknames: this.toArray()
        }
    }

    toArray(): string[] {
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

        for (const nickname of this.nicknames)
            offset = writeTinyString(buffer, nickname, offset)

        return resultOffset
    }
}