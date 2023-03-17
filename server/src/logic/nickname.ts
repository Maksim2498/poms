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

    forceDeleteUserNickname(connection: Connection, user: User, nickname: string): Promise<void>
    deleteUserNickname(connection: Connection, user: User, nickname: string, options?: DeleteUserNicknameOptions): Promise<boolean>

    deleteNickname(connection: Connection, nickname: string, force:  true):    Promise<true>
    deleteNickname(connection: Connection, nickname: string, force?: boolean): Promise<boolean>

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
        this.logger?.debug(typeof user === "string" ? `Deleting all nicknames of user "${user}"...`
                                                    : `Deleting all nicknames of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, checkUser)
        
        if (id == null) {
            this.logger?.debug("Deleted (0)")
            return 0
        }

        const [result] = await connection.execute("DELETE FROM Nicknames WHERE user_id = ?", [id]) as [ResultSetHeader, FieldPacket[]]
        const count    = result.affectedRows

        this.logger?.debug(`Deleted (${count})`)

        return count
    }

    async deleteAllNicknames(connection: Connection): Promise<number> {
        this.logger?.debug("Deleting all nicknames...")

        const [result] = await connection.execute("DELETE FROM Nicknames") as [ResultSetHeader, FieldPacket[]]
        const count    = result.affectedRows

        this.logger?.debug(`Deleted (${count})`)

        return count
    }

    async forceDeleteUserNickname(connection: Connection, user: User, nickname: string) {
        await this.deleteUserNickname(connection, user, nickname, {
            checkNickname: true,
            checkUser:     true
        })
    }

    async deleteUserNickname(connection: Connection, user: User, nickname: string, options: DeleteUserNicknameOptions): Promise<boolean> {
        this.logger?.debug(typeof user === "string" ? `Deleting nickname "${nickname}" of user "${user}"...`
                                                    : `Deleting all nickname "${nickname}" of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, options.checkUser)

        if (id == null) {
            this.logger?.debug("Not deleted")
            return false
        }

        const [result] = await connection.execute("DELETE FROM Nicknames WHERE user_id = ? AND nickname = ?", [id, nickname]) as [ResultSetHeader, FieldPacket[]]

        if (result.affectedRows === 0) {
            if (options.checkNickname) {
                const message = typeof user === "string" ? `User "${user}" has no nickname "${nickname}"`
                                                         : `User with id ${user} has no nickname "${nickname}"`
                                                         
                throw new LogicError(message)
            }

            this.logger?.debug("Not deleted")

            return false
        }

        this.logger?.debug("Deleted")

        return true
    }

    async deleteNickname(connection: Connection, nickname: string, force:  true):            Promise<true>
    async deleteNickname(connection: Connection, nickname: string, force?: boolean):         Promise<boolean>
    async deleteNickname(connection: Connection, nickname: string, force:  boolean = false): Promise<boolean> {
        const [result] = await connection.execute("DELETE FROM Nicknames WHERE nickname = ?", [nickname]) as [ResultSetHeader, FieldPacket[]]
        const deleted  = result.affectedRows !== 0

        if (!deleted) {
            if (force)
                throw new LogicError(`Nickname "${nickname}" not found`)

            return false
        }

        return true
    }

    async getNicknameOwnerInfo(connection: Connection, nickname: string, force:  true):            Promise<UserInfo>
    async getNicknameOwnerInfo(connection: Connection, nickname: string, force?: boolean):         Promise<UserInfo | undefined>
    async getNicknameOwnerInfo(connection: Connection, nickname: string, force:  boolean = false): Promise<UserInfo | undefined> {
        return undefined
    }

    async getNicknameOwnerId(connection: Connection, nickname: string, force:  true):            Promise<number>
    async getNicknameOwnerId(connection: Connection, nickname: string, force?: boolean):         Promise<number | undefined>
    async getNicknameOwnerId(connection: Connection, nickname: string, force:  boolean = false): Promise<number | undefined> {
        const [rows] = await connection.execute("SELECT user_id FROM Nicknames WHERE nickname = ?", [nickname]) as [RowDataPacket[], FieldPacket[]]

        if (rows.length === 0) {
            if (force)
                throw new LogicError(`There is no owner of nickname "${nickname}"`)
        
            return undefined
        }

        return rows[0].user_id
    }

    async getUserNicknameCount(connection: Connection, user: User, checkUser: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Getting nickname count of user "${user}"...`
                                                    : `Getting nickname count of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null)
            return 0

        const [rows] = await connection.execute("SELECT COUNT(*) AS count FROM NICKNAMES WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]
        const count  = rows[0].count

        this.logger?.debug(`Got: ${count}`)

        return count
    }

    async forceAddUserNickname(connection: Connection, user: User, nickname: string) {
        await this.addUserNickname(connection, user, nickname, {
            checkUser:        true,
            throwOnLimit:     true,
            throwOnDuplicate: true
        })
    }

    async addUserNickname(connection: Connection, user: User, nickname: string, options?: AddUserNicknameOptions): Promise<boolean> {
        this.logger?.debug(typeof user === "string" ? `Adding nickname "${nickname}" of user "${user}"...`
                                                    : `Adding nickname "${nickname}" of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, options?.checkUser)

        if (id == null) {
            this.logger?.debug("Not added")
            return false
        }

        const count = await this.getUserNicknameCount(connection, id)

        if (count >= this.config.logicMaxNicknames) {
            if (options?.throwOnLimit)
                throw new LogicError("Too many nicknames")

            this.logger?.debug("Not added")

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

                this.logger?.debug("Not added")

                return false
            }

            throw error
        }

        this.logger?.debug("Added")

        return true
    }

    async getUserNicknames(connection: Connection, user: User, checkUser: boolean = false): Promise<string[]> {
        this.logger?.debug(typeof user === "string" ? `Getting nicknames of user "${user}"...`
                                                    : `Getting nicknames of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null)
            return []

        const [rows]    = await connection.execute("SELECT nickname FROM Nicknames WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]
        const nicknames = rows.map(row => row.nickname)

        this.logger?.debug(`Got: ${nicknames.map(n => `"${n}"`).join(", ")}`)

        return nicknames
    }
}