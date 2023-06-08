import z                   from "zod"
import BufferWritable      from "util/buffer/BufferWritable"

import { checkBufferSize } from "util/buffer/buffer"

export type UserRoleName = "user"
                         | "moderator"
                         | "admin"
                         | "owner"

export type UserRoleId   = 0
                         | 1
                         | 2
                         | 3

export type UserRoleJSON = z.infer<typeof UserRole.JSON_SCHEMA>

/*
    Buffer structure:

    struct UserRole {
        uint8_t id: 2;
    };
*/

export default class UserRole implements BufferWritable {
    static readonly JSON_SCHEMA = z.literal("user")
                              .or(z.literal("moderator")) 
                              .or(z.literal("admin"))
                              .or(z.literal("owner"))

    static readonly BYTE_LENGTH = 1 // uint8_t

    static readonly USER        = new UserRole("user",      0)
    static readonly MODERATOR   = new UserRole("moderator", 1)
    static readonly ADMIN       = new UserRole("admin",     2)
    static readonly OWNER       = new UserRole("owner",     3)

    static fromJSON(json: unknown): UserRole {
        const parsed = UserRole.JSON_SCHEMA.parse(json)
        return UserRole.fromParsedJSON(parsed)
    }

    static fromParsedJSON(json: UserRoleJSON): UserRole {
        return UserRole.fromName(json)
    }

    static fromBuffer(buffer: Buffer, offset: number = 0): UserRole {
        checkBufferSize(buffer, offset + UserRole.BYTE_LENGTH)

        const id = (buffer.readUInt8(offset) & 0x3) as UserRoleId

        return UserRole.fromId(id)
    }

    static isUserRoleName(name: string): name is UserRoleName {
        switch (name) {
            case "user":
            case "moderator":
            case "admin":
            case "owner":
                return true

            default:
                return false
        }
    }

    static isUserRoleId(id: number): id is UserRoleId {
        switch (id) {
            case 0:
            case 1:
            case 2:
            case 3:
                return true

            default:
                return false
        }
    }

    static fromName(name: UserRoleName): UserRole
    static fromName(name: string):       UserRole | undefined
    static fromName(name: string):       UserRole | undefined {
        switch (name) {
            case "user":
                return UserRole.USER

            case "moderator":
                return UserRole.MODERATOR

            case "admin":
                return UserRole.ADMIN

            case "owner":
                return UserRole.OWNER

            default:
                return undefined
        }
    }

    static fromId(id: UserRoleId): UserRole
    static fromId(id: number):     UserRole | undefined
    static fromId(id: number):     UserRole | undefined {
        switch (id) {
            case 0:
                return UserRole.USER

            case 1:
                return UserRole.MODERATOR

            case 2:
                return UserRole.ADMIN

            case 3:
                return UserRole.OWNER

            default:
                return undefined
        }
    }

    readonly name: UserRoleName
    readonly id:   UserRoleId

    private constructor(name: UserRoleName, id: UserRoleId) {
        this.name = name
        this.id   = id
    }

    get byteLength(): number {
        return UserRole.BYTE_LENGTH
    }

    toJSON(): UserRoleJSON {
        return this.name
    }

    toString(): string {
        return this.name
    }

    toBuffer(): Buffer {
        const buffer = Buffer.alloc(this.byteLength)
        this.writeToBuffer(buffer)
        return buffer
    }

    writeToBuffer(buffer: Buffer, offset: number = 0): number {
        checkBufferSize(buffer, offset + this.byteLength)
        return buffer.writeUInt8(this.id, offset)
    }
}