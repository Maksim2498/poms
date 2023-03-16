import Config                                     from "Config"
import LogicError                                 from "./LogicError"

import { QueryError, ResultSetHeader } from "mysql2"
import { Connection, FieldPacket, RowDataPacket } from "mysql2/promise"
import { Logger                                 } from "winston"
import { UserManager, User, UserInfo            } from "./user"

export interface CreationOptions {
    readonly userManager: UserManager
    readonly config:      Config
    readonly logger?:     Logger
}

export interface DeleteUserNicknameOptions {
    checkUser?:     boolean
    checkNickname?: boolean
}

export interface AddUserNicknameOptions {
    checkUser?:        boolean
    throwOnLimit?:     boolean
    throwOnDuplicate?: boolean
}

export interface NicknameManager {
    deleteAllUserNicknames(connection: Connection, user: User, checkUser?: boolean): Promise<number>

    deleteAllNicknames(connection: Connection): Promise<number>

    deleteUserNickname(connection: Connection, user: User, nickname: string, options?: DeleteUserNicknameOptions): Promise<boolean>

    deleteNickname(connection: Connection, nickname: string): Promise<boolean>

    getNicknameOwnerInfo(connection: Connection, nickname: string, force:  true):    Promise<UserInfo>
    getNicknameOwnerInfo(connection: Connection, nickname: string, force?: boolean): Promise<UserInfo | undefined>

    getNicknameOwnerId(connection: Connection, nickname: string, force:  true):    Promise<number>
    getNicknameOwnerId(connection: Connection, nickname: string, force?: boolean): Promise<number | undefined>

    getUserNicknameCount(connection: Connection, user: User, checkUser?: boolean): Promise<number>

    forceAddUserNickname(connection: Connection, user: User, nickname: string): Promise<void>
    addUserNickname(connection: Connection, user: User, nickname: string, options?: AddUserNicknameOptions): Promise<boolean>

    getUserNicknames(connection: Connection, user: User, checkUser?: boolean): Promise<string[]>
}

export class DefaultNicknameManager implements NicknameManager {
    readonly userManager: UserManager
    readonly config:      Config
    readonly logger?:     Logger

    constructor(options: CreationOptions) {
        this.userManager = options.userManager
        this.config      = options.config
        this.logger      = options.logger
    }

    async deleteAllUserNicknames(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        const id = await this.userManager.getUserId(connection, user, checkUser)
        
        if (id == null)
            return 0

        const [result] = await connection.execute("DELETE FROM Nicknames WHERE user_id = ?", [id]) as [ResultSetHeader, FieldPacket[]]

        return result.affectedRows
    }

    async deleteAllNicknames(connection: Connection): Promise<number> {
        const [result] = await connection.execute("DELETE FROM Nicknames") as [ResultSetHeader, FieldPacket[]]

        return result.affectedRows

    }

    async deleteUserNickname(connection: Connection, user: User, nickname: string, options: DeleteUserNicknameOptions): Promise<boolean> {
        return false
    }

    async deleteNickname(connection: Connection, nickname: string): Promise<boolean> {
        return false
    }

    async getNicknameOwnerInfo(connection: Connection, nickname: string, force:  true):            Promise<UserInfo>
    async getNicknameOwnerInfo(connection: Connection, nickname: string, force?: boolean):         Promise<UserInfo | undefined>
    async getNicknameOwnerInfo(connection: Connection, nickname: string, force:  boolean = false): Promise<UserInfo | undefined> {
        return undefined
    }

    async getNicknameOwnerId(connection: Connection, nickname: string, force:  true):            Promise<number>
    async getNicknameOwnerId(connection: Connection, nickname: string, force?: boolean):         Promise<number | undefined>
    async getNicknameOwnerId(connection: Connection, nickname: string, force:  boolean = false): Promise<number | undefined> {
        return undefined
    }

    async getUserNicknameCount(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null)
            return 0

        const [rows] = await connection.execute("SELECT COUNT(*) AS count FROM NICKNAMES WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]

        return rows[0].count
    }

    async forceAddUserNickname(connection: Connection, user: User, nickname: string) {
        await this.addUserNickname(connection, user, nickname, {
            checkUser:        true,
            throwOnLimit:     true,
            throwOnDuplicate: true
        })
    }

    async addUserNickname(connection: Connection, user: User, nickname: string, options?: AddUserNicknameOptions): Promise<boolean> {
        const id = await this.userManager.getUserId(connection, user, options?.checkUser)

        if (id == null)
            return false

        const count = await this.getUserNicknameCount(connection, id)

        if (count >= this.config.logicMaxNicknames) {
            if (options?.throwOnLimit)
                throw new LogicError("Too many nicknames")

            return false
        }

        try {
            await connection.execute("INSERT INTO Nicknames (user_id, nickname) VALUES (?, ?)", [id, nickname])
        } catch (error) {
            const code = (error as any).code

            if (code === "ER_DUP_ENTRY") {
                if (options?.throwOnDuplicate) {
                    const message = typeof user === "string" ? `User "${user}" already has nickname "${nickname}"`
                                                             : `User with id ${user} already has nickname "${nickname}"`

                    throw new LogicError(message)
                }

                return false
            }

            throw error
        }

        return true
    }

    async getUserNicknames(connection: Connection, user: User, checkUser: boolean = false): Promise<string[]> {
        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null)
            return []

        const [rows] = await connection.execute("SELECT nickname FROM Nicknames WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]

        return rows.map(row => row.nickname)
    }
}