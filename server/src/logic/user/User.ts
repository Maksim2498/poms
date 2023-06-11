import crypto                                                          from "crypto"
import z                                                               from "zod"
import Config                                                          from "Config"
import LogicError                                                      from "logic/LogicError"
import UserNicknameSet                                                 from "logic/user/UserNicknameSet"
import Token                                                           from "logic/token/Token"
import TokenSet                                                        from "logic/token/TokenSet"
import ReadonlyDate                                                    from "util/date/ReadonlyDate"
import BufferWritable                                                  from "util/buffer/BufferWritable"
import DeepReadonly                                                    from "util/type/DeepReadonly"
import UserRole                                                        from "./UserRole"

import { checkBufferSize,
         BYTE_LENGTH_OF_DATE,        readDate,       writeDate,
         BYTE_LENGTH_OF_BOOLEAN,     readBoolean,    writeBoolean,
         BYTE_LENGTH_OF_TINY_STRING, readTinyString, writeTinyString } from "util/buffer/buffer"
import { collapseWs, escape, isHex                                   } from "util/string"
import { isUInt                                                      } from "util/number"

export interface BaseUserOptions {
    readonly config:        Config
    readonly id:            number
    readonly login:         string
    readonly name?:         string | null
    readonly icon?:         Buffer | null
    readonly password?:     string
    readonly passwordHash?: Buffer
    readonly role?:         UserRole
    readonly isOnline?:     boolean
    readonly created?:      Date
    readonly creatorId?:    number | null
    readonly nicknames?:    Iterable<string>
    readonly tokens?:       Iterable<Token>
    readonly dontCheck?:    boolean
}

export interface PasswordUserOptions extends BaseUserOptions {
    readonly password: string
}

export interface PasswordHashUserOptions extends BaseUserOptions {
    readonly passwordHash: Buffer
}

export type UserOptions = PasswordUserOptions
                        | PasswordHashUserOptions

export type UserJSON         = z.infer<typeof User.JSON_SCHEMA>
export type ReadonlyUserJSON = DeepReadonly<UserJSON>

/*
    Buffer structure:

    struct TokenSet;        // See login/token/TokenSet.ts
    struct UserNicknameSet; // See logic/NicknameSet.ts
    struct TinyString;      // See util/buffer.ts
    struct Date;            // See util/buffer.ts

    struct User {                                    // Offset                                     Accumulated Size
        uint64_t               id;                   // 0                                          8
        struct TinyString      login;                // 8                                          264
        bool                   hasName;              // 264                                        265
        struct TinyString      name;                 // 265                                        521
        char                   passwordHash[64];     // 521                                        585
        struct Date            created;              // 585                                        593
        bool                   hasCreator;           // 593                                        594
        uint64_t               creatorId;            // 594                                        602
        bool                   isOnline;             // 602                                        603
        struct UserRole        role;                 // 603                                        604
        struct UserNicknameSet nicknames;            // 604                                        604 + sizeof(nicknames)
        struct TokenSet        tokens;               // 604 + sizeof(nicknames)                    604 + sizeof(nicknames) + sizeof(tokens)
        bool                   hasIcon;              // 604 + sizeof(nicknames) + sizeof(tokens)   605 + sizeof(nicknames) + sizeof(tokens)
        uint32_t               iconByteLength;       // 605 + sizeof(nicknames) + sizeof(tokens)   609 + sizoef(nicknames) + sizeof(tokens)
        char                   icon[this.icon_size]; // 609 + sizeof(nicknames) + sizeof(tokens)   609 + sizoef(nicknames) + sizeof(tokens) + icon_size
    };
*/

export default class User implements BufferWritable {
    static readonly MIN_BYTE_LENGTH_OF_LOGIN        = 4
    static readonly MAX_BYTE_LENGTH_OF_LOGIN        = 255

    static readonly MAX_BYTE_LENGTH_OF_NAME         = 255

    static readonly BYTE_LENGTH_OF_PASSWORD_HASH    = 64
    static readonly MIN_BYTE_LENGTH_OF_PASSWORD     = 4

    static readonly BYTE_LENGTH_OF_ID               = 8 // uint64_t

    static readonly BYTE_LENGTH_OF_ICON_BYTE_LENGTH = 4 // uint32_t
    static readonly MAX_BYTE_LENGTH_OF_ICON         = 2 ** 24

    static readonly MIN_BYTE_LENGTH                 = 2 * this.BYTE_LENGTH_OF_ID     // id, creatorId
                                                    + 2 * BYTE_LENGTH_OF_TINY_STRING // login, name
                                                    + 4 * BYTE_LENGTH_OF_BOOLEAN     // hasName, hasCreator, isOnline, hasIcon
                                                    +     this.BYTE_LENGTH_OF_PASSWORD_HASH
                                                    +     BYTE_LENGTH_OF_DATE
                                                    +     UserRole.BYTE_LENGTH
                                                    +     this.BYTE_LENGTH_OF_ICON_BYTE_LENGTH

    static readonly ID_JSON_SCHEMA = z.number().int().nonnegative()

    static readonly LOGIN_JSON_SCHEMA = z.string().transform((login, ctx) => {
        login = User.normLogin(login)

        const invalidReason = User.validateNormedLogin(login)

        if (invalidReason != null) {
            ctx.addIssue({
                code:    "custom",
                message: invalidReason,
            })

            return z.NEVER
        }

        return login
    })

    static readonly NAME_JSON_SCHEMA = z.string().nullable().transform((name, ctx) => {
        name = User.normName(name)

        const invalidReason = User.validateNormedName(name)

        if (invalidReason != null) {
            ctx.addIssue({
                code:    "custom",
                message: invalidReason,
            })

            return z.NEVER
        }

        return name
    })

    static readonly JSON_SCHEMA = z.object({
        id:           User.ID_JSON_SCHEMA,
        login:        User.LOGIN_JSON_SCHEMA,
        name:         User.NAME_JSON_SCHEMA,
        icon:         z.string().refine(isHex).nullable(),
        passwordHash: z.string().length(2 * User.BYTE_LENGTH_OF_PASSWORD_HASH).refine(isHex),
        role:         UserRole.JSON_SCHEMA,
        isOnline:     z.boolean(),
        created:      z.string().datetime(),
        creatorId:    User.ID_JSON_SCHEMA.nullable(),
        nicknames:    UserNicknameSet.JSON_SCHEMA,
        tokens:       TokenSet.JSON_SCHEMA,
    })

    static fromJSON(config: Config, json: unknown): User {
        const parsed = User.JSON_SCHEMA.parse(json)
        return User.fromParsedJSON(config, parsed, true)
    }

    static fromParsedJSON(config: Config, json: UserJSON, dontCheck: boolean = false): User {
        const {
            id,
            login,
            name,
            creatorId,
            isOnline,
        } = json

        const icon         = json.icon != null ? Buffer.from(json.icon, "hex") : null
        const passwordHash = Buffer.from(json.passwordHash, "hex")
        const role         = UserRole.fromParsedJSON(json.role)
        const created      = new Date(json.created)
        const nicknames    = UserNicknameSet.fromParsedJSON(json.nicknames, dontCheck)
        const tokens       = TokenSet.fromParsedJSON(json.tokens, dontCheck)
        
        return new User({
            config,
            id,
            login,
            name,
            creatorId,
            isOnline,
            icon,
            passwordHash,
            role,
            created,
            nicknames,
            tokens,
            dontCheck,
        })
    }

    static fromBuffer(config: Config, buffer: Buffer, offset: number = 0, dontCheck: boolean = false): User {
        checkBufferSize(buffer, offset + User.MIN_BYTE_LENGTH)

        const id = User.readId(buffer, offset)
        offset += User.BYTE_LENGTH_OF_ID

        const login = readTinyString(buffer, offset)
        offset += BYTE_LENGTH_OF_TINY_STRING

        const hasName = readBoolean(buffer, offset)
        offset += BYTE_LENGTH_OF_BOOLEAN

        const name = hasName ? readTinyString(buffer, offset) : null
        offset += BYTE_LENGTH_OF_TINY_STRING

        const nextOffset   = offset + this.BYTE_LENGTH_OF_PASSWORD_HASH
        const passwordHash = buffer.subarray(offset, nextOffset)
        offset = nextOffset

        const created = readDate(buffer, offset)
        offset += BYTE_LENGTH_OF_DATE

        const hasCreator = readBoolean(buffer, offset)
        offset += BYTE_LENGTH_OF_BOOLEAN

        const creatorId = hasCreator ? User.readId(buffer, offset) : null
        offset += User.BYTE_LENGTH_OF_ID

        const isOnline = readBoolean(buffer, offset)
        offset += BYTE_LENGTH_OF_BOOLEAN

        const role = UserRole.fromBuffer(buffer, offset)
        offset += role.byteLength

        const nicknames = UserNicknameSet.fromBuffer(buffer, offset, dontCheck)
        offset += nicknames.byteLength

        const tokens = TokenSet.fromBuffer(buffer, offset, dontCheck)
        offset += tokens.byteLength

        const hasIcon = readBoolean(buffer, offset)
        offset += BYTE_LENGTH_OF_BOOLEAN

        const iconByteLength = buffer.readUInt32LE(offset)
        offset += User.BYTE_LENGTH_OF_ICON_BYTE_LENGTH

        const icon = hasIcon ? buffer.subarray(offset, offset + iconByteLength) : null

        return new User({
            config,
            id,
            login,
            name,
            passwordHash,
            created,
            creatorId,
            isOnline,
            role,
            nicknames,
            tokens,
            icon,
            dontCheck,
        })
    }

    static readId(buffer: Buffer, offset: number = 0): number {
        return Number(buffer.readBigUInt64LE(offset))
    }

    static writeId(buffer: Buffer, id: number, offset: number = 0): number {
        return buffer.writeBigUInt64LE(BigInt(id), offset)
    }

    static checkCreatorId(creatorId: number | null) {
        const invalidReason = User.validateCreatorId(creatorId)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validateCreatorId(creatorId: null):          undefined
    static validateCreatorId(creatorId: number | null): string | undefined
    static validateCreatorId(creatorId: number | null): string | undefined {
        if (creatorId == null)
            return undefined

        if (isUInt(creatorId))
            return undefined

        return `Creator id ${creatorId} is not an unsigend integer`
    }

    static checkId(id: number) {
        const invalidReason = User.validateId(id)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validateId(id: number): string | undefined {
        return isUInt(id) ? undefined
                          : `User id ${id} is not an unsigned integer`
    }

    static checkLogin(login: string) {
        const invalidReason = User.validateLogin(login)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static checkNormedLogin(login: string) {
        const invalidReason = User.validateNormedLogin(login)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validateLogin(login: string): string | undefined {
        return User.validateNormedLogin(User.normLogin(login))
    }

    static validateNormedLogin(login: string): string | undefined {
        const length = Buffer.byteLength(login)

        if (length < User.MIN_BYTE_LENGTH_OF_LOGIN)
            return `Login "${escape(login)}" is too small. Minimum size expected: ${User.MIN_BYTE_LENGTH_OF_LOGIN}. Got: ${length}`

        if (length > User.MAX_BYTE_LENGTH_OF_LOGIN)
            return `Login "${escape(login)}" is too big. Maximum size expected: ${User.MAX_BYTE_LENGTH_OF_LOGIN}. Got: ${length}`

        if (login.match(/^\p{L}[\p{L}\p{N}]*$/u) == null)
            return `Login "${escape(login)}" is malformed. It must start with a letter and continue with letters and/or digits`

        return undefined
    }

    static normLogin(login: string): string {
        return login.trim()
    }

    static checkName(name: string | null) {
        const invalidReason = User.validateName(name)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static checkNormedName(name: string | null) {
        const invalidReason = User.validateNormedName(name)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validateName(name: string | null): string | undefined {
        return User.validateNormedName(User.normName(name))
    }

    static validateNormedName(name: null):          undefined
    static validateNormedName(name: string | null): string | undefined
    static validateNormedName(name: string | null): string | undefined {
        if (name == null)
            return undefined

        if (name.length === 0)
            return `Name must not to be blank`

        const length = Buffer.byteLength(name)

        if (length > User.MAX_BYTE_LENGTH_OF_NAME)
            return `Name "${escape(name)}" is too big. Maximum size expected: ${User.MAX_BYTE_LENGTH_OF_NAME}. Got: ${length}`

        return undefined
    }

    static normName(name: null):          string
    static normName(name: string | null): string | null
    static normName(name: string | null): string | null {
        if (name == null)
            return null

        name = collapseWs(name)

        if (name.length === 0)
            return null

        return name
    }

    static checkPasswordHash(passwordHash: Buffer) {
        const invalidReason = User.validatePasswordHash(passwordHash)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validatePasswordHash(passwordHash: Buffer): string | undefined {
        if (passwordHash.length !== User.BYTE_LENGTH_OF_PASSWORD_HASH)
            return `Invalid password hash size. Expected: ${User.BYTE_LENGTH_OF_PASSWORD_HASH}. Got: ${passwordHash.length}`

        return undefined
    }

    static checkPassword(password: string) {
        const invalidReason = User.validatePassword(password)
        
        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validatePassword(password: string): string | undefined {
        const length = Buffer.byteLength(password)

        if (length < User.MIN_BYTE_LENGTH_OF_PASSWORD)
            return `Password is too small. Minimum size expected: ${User.MIN_BYTE_LENGTH_OF_PASSWORD}. Got: ${length}`

        return undefined
    }

    static evalPasswordHash(login: string, password: string): Buffer {
        login = User.normLogin(login)

        User.checkNormedLogin(login)
        User.checkPassword(password)

        return User.evalPasswordHashNotChecking(login, password)
    }

    static evalPasswordHashNotChecking(normedLogin: string, normedPassword: string): Buffer {
        return crypto.createHash("sha512")
                     .update(`${normedLogin.toLowerCase()}:${normedPassword}`)
                     .digest()
    }

    static checkIcon(config: Config, icon: Buffer | null) {
        const invalidReason = User.validateIcon(config, icon)

        if (invalidReason != null)
            throw new LogicError(invalidReason)
    }

    static validateIcon(config: Config, icon: Buffer | null): string | undefined {
        if (icon === null)
            return undefined

        const max = config.read.logic.maxIconSize

        if (icon.length > max)
            return `Icon is too big. Maximum size expected: ${max}. Got: ${icon.length}`

        return undefined
    }

    private  _name:         string | null
    private  _passwordHash: Buffer
    private  _icon:         Buffer | null

    readonly config:        Config
    readonly id:            number
    readonly login:         string
    readonly created:       ReadonlyDate
    readonly creatorId:     number | null
    readonly nicknames:     UserNicknameSet
    readonly tokens:        TokenSet

             role:          UserRole
             isOnline:      boolean

    constructor(options: UserOptions) {
        const config       = options.config
        const id           = options.id
        let   login        = options.login
        let   name         = options.name      ?? null
        const icon         = options.icon      ?? null
        const password     = options.password
        let   passwordHash = options.passwordHash
        const role         = options.role      ?? UserRole.USER
        const isOnline     = options.isOnline  ?? false
        const created      = options.created   ?? new Date()
        const creatorId    = options.creatorId ?? null
        const nicknames    = options.nicknames
        const tokens       = options.tokens
        const dontCheck    = options.dontCheck

        if (dontCheck)
            passwordHash ??= User.evalPasswordHashNotChecking(login, password!)
        else {
            User.checkId(id)
            
            login = User.normLogin(login)
            User.checkNormedLogin(login)

            name = User.normName(name)
            User.checkNormedName(name)

            User.checkIcon(config, icon)

            if (passwordHash == null) {
                User.checkPassword(password!)
                passwordHash = User.evalPasswordHash(login, password!)
            } else
                User.checkPasswordHash(passwordHash)

            User.checkCreatorId(creatorId)
        }

        this.config        = config
        this.id            = id
        this.login         = login
        this._name         = name
        this._icon         = icon
        this._passwordHash = passwordHash
        this.role          = role
        this.isOnline      = isOnline
        this.created       = created
        this.creatorId     = creatorId

        if (nicknames instanceof UserNicknameSet)
            this.nicknames = nicknames
        else
            this.nicknames = new UserNicknameSet({
                max: config.read.logic.maxNicknames,
                nicknames,
                dontCheck,
            })

        if (tokens instanceof TokenSet)
            this.tokens = tokens
        else
            this.tokens = new TokenSet({
                max: config.read.logic.maxTokens,
                tokens,
                dontCheck,
            })
    }

    get byteLength(): number {
        return User.MIN_BYTE_LENGTH
             + this.nicknames.byteLength
             + this.tokens.byteLength
             + this.iconByteLength
    }

    get hasName(): boolean {
        return this._name != null
    }

    get hasCreator(): boolean {
        return this.creatorId != null
    }

    get iconByteLength(): number {
        return this._icon?.length ?? 0
    }

    get hasIcon(): boolean {
        return this._icon != null;
    }

    get name(): string | null {
        return this._name
    }

    set name(name: string | null) {
        name = User.normName(name)
        User.checkNormedName(name)
        this._name = name
    }

    get passwordHash(): Buffer {
        return this._passwordHash
    }

    set passwordHash(passwordHash: Buffer) {
        User.checkPasswordHash(passwordHash)
        this._passwordHash = passwordHash
    }

    get icon(): Buffer | null {
        return this._icon
    }

    set icon(icon: Buffer | null) {
        User.checkIcon(this.config, icon)
        this._icon = icon
    }

    toString(): string {
        return this.id != null ? `${this.login}[${this.id}]`
                               : this.login
    }

    toJSON(): UserJSON {
        return {
            id:           this.id,
            login:        this.login,
            name:         this.name,
            icon:         this.icon?.toString("hex") ?? null,
            passwordHash: this.passwordHash.toString("hex"),
            role:         this.role.toJSON(),
            isOnline:     this.isOnline,
            created:      this.created.toJSON(),
            creatorId:    this.creatorId,
            nicknames:    this.nicknames.toJSON(),
            tokens:       this.tokens.toJSON(),
        }
    }

    toBuffer(): Buffer {
        const buffer = Buffer.alloc(this.byteLength)
        this.writeToBuffer(buffer)
        return buffer
    }

    writeToBuffer(buffer: Buffer, offset: number = 0): number {
        checkBufferSize(buffer, offset + this.byteLength)

        offset = User.writeId(buffer, this.id, offset)
        offset = writeTinyString(buffer, this.login, offset)
        offset = writeBoolean(buffer, this.hasName, offset)

        if (this.hasName)
            offset  = writeTinyString(buffer, this.name!, offset)
        else
            offset += BYTE_LENGTH_OF_TINY_STRING

        offset += this.passwordHash.copy(buffer, offset)
        offset  = writeDate(buffer, this.created, offset)
        offset  = writeBoolean(buffer, this.hasCreator, offset)

        if (this.hasCreator)
            offset = User.writeId(buffer, this.creatorId!, offset)
        else
            offset += User.BYTE_LENGTH_OF_ID

        offset = writeBoolean(buffer, this.isOnline, offset)
        offset = this.role.writeToBuffer(buffer, offset)
        offset = this.nicknames.writeToBuffer(buffer, offset)
        offset = this.tokens.writeToBuffer(buffer, offset)
        offset = writeBoolean(buffer, this.hasIcon, offset)
        offset = buffer.writeUInt32LE(this.iconByteLength, offset)

        if (this.hasIcon)
            offset += this.icon!.copy(buffer, offset)

        return offset
    }
}