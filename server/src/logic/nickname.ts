import Config                                     from "Config"
import LogicError                                 from "./LogicError"

import { ResultSetHeader                        } from "mysql2"
import { Connection, FieldPacket, RowDataPacket } from "mysql2/promise"
import { Logger                                 } from "winston"
import { UserManager, User, UserInfo            } from "./user"

export interface CreationOptions {
    readonly userManager: UserManager
    readonly config:      Config
    readonly logger?:     Logger
}

export interface SetUserNicknamesOptions {
    throwOnInvalidUser?: boolean
    throwOnLimit?:       boolean
}

export interface DeleteUserNicknameOptions {
    throwOnInvalidUser?:     boolean
    throwOnInvalidNickname?: boolean
}

export interface AddUserNicknameOptions {
    throwOnInvalidUser?: boolean
    throwOnLimit?:       boolean
    throwOnDuplicate?:   boolean
}

export interface NicknameManager {
    forceSetUserNicknames(connection: Connection, user: User, nicknames: string[] | null): Promise<void>

    setUserNicknames(connection: Connection, user: User, nicknames: string[] | null, options?: SetUserNicknamesOptions): Promise<boolean>


    forceDeleteAllUserNicknames(connection: Connection, user: User): Promise<void>

    deleteAllUserNicknames(connection: Connection, user: User, throwOnFailure?: boolean): Promise<number>


    deleteAllNicknames(connection: Connection): Promise<number>


    forceDeleteUserNickname(connection: Connection, user: User, nickname: string): Promise<void>

    deleteUserNickname(connection: Connection, user: User, nickname: string, options?: DeleteUserNicknameOptions): Promise<boolean>


    forceDeleteNickname(connection: Connection, nickname: string): Promise<void>

    deleteNickname(connection: Connection, nickname: string, throwOnFailure:  true):    Promise<true>
    deleteNickname(connection: Connection, nickname: string, throwOnFailure?: boolean): Promise<boolean>


    forceGetNicknameOwnerInfo(connection: Connection, nickname: string): Promise<UserInfo>

    getNicknameOwnerInfo(connection: Connection, nickname: string, throwOnFailure:  true):    Promise<UserInfo>
    getNicknameOwnerInfo(connection: Connection, nickname: string, throwOnFailure?: boolean): Promise<UserInfo | undefined>


    forceGetNicknameOwnerId(connection: Connection, nickname: string): Promise<number>

    getNicknameOwnerId(connection: Connection, nickname: string, throwOnFailure:  true):    Promise<number>
    getNicknameOwnerId(connection: Connection, nickname: string, throwOnFailure?: boolean): Promise<number | undefined>


    forceGetUserNicknameCount(connection: Connection, user: User): Promise<number>

    getUserNicknameCount(connection: Connection, user: User, throwOnFailure?: boolean): Promise<number>


    forceAddUserNickname(connection: Connection, user: User, nickname: string): Promise<void>

    addUserNickname(connection: Connection, user: User, nickname: string, options?: AddUserNicknameOptions): Promise<boolean>


    forceGetUserNicknames(connection: Connection, user: User): Promise<string[]>

    getUserNicknames(connection: Connection, user: User, throwOnFailure?: boolean): Promise<string[]>
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

    async forceSetUserNicknames(connection: Connection, user: User, nicknames: string[] | null) {
        await this.setUserNicknames(connection, user, nicknames, {
            throwOnLimit:       true,
            throwOnInvalidUser: true
        })
    }

    async setUserNicknames(connection: Connection, user: User, nicknames: string[] | null, options?: SetUserNicknamesOptions): Promise<boolean> {
        this.logger?.debug(typeof user === "string" ? `Setting nicknames of user "${user}" to [${nicknames?.join(", ")}]...`
                                                    : `Setting nicknames of user with id ${user} to [${nicknames?.join(", ")}]...`)

        const count = nicknames?.length ?? 0

        if (count > this.config.logicMaxNicknames) {
            const message = "Too many nicknames"

            if (options?.throwOnLimit)
                throw new LogicError(message)

            this.logger?.debug(message)

            return false
        }

        const userId = await this.userManager.getUserId(connection, user, options?.throwOnInvalidUser)

        if (userId == null)
            return false

        await this.deleteAllUserNicknames(connection, userId)

        if (count > 0)
            await Promise.all(nicknames!.map(nickname => this.addUserNickname(connection, userId, nickname, { throwOnDuplicate: true })))

        this.logger?.debug("Set")

        return true
    }

    async forceDeleteAllUserNicknames(connection: Connection, user: User) {
        await this.deleteAllUserNicknames(connection, user, true)
    }

    async deleteAllUserNicknames(connection: Connection, user: User, throwOnFailure: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Deleting all nicknames of user "${user}"...`
                                                    : `Deleting all nicknames of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, throwOnFailure)
        
        if (id == null)
            return 0

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
            throwOnInvalidNickname: true,
            throwOnInvalidUser:     true
        })
    }

    async deleteUserNickname(connection: Connection, user: User, nickname: string, options: DeleteUserNicknameOptions): Promise<boolean> {
        this.logger?.debug(typeof user === "string" ? `Deleting nickname "${nickname}" of user "${user}"...`
                                                    : `Deleting all nickname "${nickname}" of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, options.throwOnInvalidUser)

        if (id == null)
            return false

        const [result] = await connection.execute("DELETE FROM Nicknames WHERE user_id = ? AND nickname = ?", [id, nickname]) as [ResultSetHeader, FieldPacket[]]

        if (result.affectedRows === 0) {
            const message = typeof user === "string" ? `User "${user}" has no nickname "${nickname}"`
                                                     : `User with id ${user} has no nickname "${nickname}"`

            if (options.throwOnInvalidNickname)
                throw new LogicError(message)

            this.logger?.debug(message)

            return false
        }

        this.logger?.debug("Deleted")

        return true
    }

    async forceDeleteNickname(connection: Connection, nickname: string) {
        await this.deleteNickname(connection, nickname, true)
    }

    async deleteNickname(connection: Connection, nickname: string, throwOnFailure:  true):            Promise<true>
    async deleteNickname(connection: Connection, nickname: string, throwOnFailure?: boolean):         Promise<boolean>
    async deleteNickname(connection: Connection, nickname: string, throwOnFailure:  boolean = false): Promise<boolean> {
        this.logger?.debug(`Deleting nickname "${nickname}"...`)

        const [result] = await connection.execute("DELETE FROM Nicknames WHERE nickname = ?", [nickname]) as [ResultSetHeader, FieldPacket[]]
        const deleted  = result.affectedRows !== 0

        if (!deleted) {
            const message = `Nickname "${nickname}" not found`

            if (throwOnFailure)
                throw new LogicError(message)

            this.logger?.debug(message)
            
            return false
        }

        this.logger?.debug("Deleted")

        return true
    }

    async forceGetNicknameOwnerInfo(connection: Connection, nickname: string): Promise<UserInfo> {
        return await this.getNicknameOwnerInfo(connection, nickname, true)
    }

    async getNicknameOwnerInfo(connection: Connection, nickname: string, throwOnFailure:  true):            Promise<UserInfo>
    async getNicknameOwnerInfo(connection: Connection, nickname: string, throwOnFailure?: boolean):         Promise<UserInfo | undefined>
    async getNicknameOwnerInfo(connection: Connection, nickname: string, throwOnFailure:  boolean = false): Promise<UserInfo | undefined> {
        this.logger?.debug(`Getting nickname "${nickname}" owner info...`)

        const id = await this.getNicknameOwnerId(connection, nickname, throwOnFailure)

        if (id == null)
            return undefined

        const info = await this.userManager.getUserInfo(connection, id)

        this.logger?.debug("Got")

        return info
    }

    async forceGetNicknameOwnerId(connection: Connection, nickname: string): Promise<number> {
        return await this.getNicknameOwnerId(connection, nickname, true)
    }

    async getNicknameOwnerId(connection: Connection, nickname: string, throwOnFailure:  true):            Promise<number>
    async getNicknameOwnerId(connection: Connection, nickname: string, throwOnFailure?: boolean):         Promise<number | undefined>
    async getNicknameOwnerId(connection: Connection, nickname: string, throwOnFailure:  boolean = false): Promise<number | undefined> {
        this.logger?.debug(`Getting nickname "${nickname}" owner id...`)

        const [rows] = await connection.execute("SELECT user_id FROM Nicknames WHERE nickname = ?", [nickname]) as [RowDataPacket[], FieldPacket[]]

        if (rows.length === 0) {
            const message = `There is no owner of nickname "${nickname}"`

            if (throwOnFailure)
                throw new LogicError(message)
        
            this.logger?.debug(message)
        
            return undefined
        }

        const id = rows[0].user_id as number

        this.logger?.debug(`Got: ${id}`)

        return id
    }

    async forceGetUserNicknameCount(connection: Connection, user: User): Promise<number> {
        return await this.getUserNicknameCount(connection, user, true)
    }

    async getUserNicknameCount(connection: Connection, user: User, throwOnFailure: boolean = false): Promise<number> {
        this.logger?.debug(typeof user === "string" ? `Getting nickname count of user "${user}"...`
                                                    : `Getting nickname count of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, throwOnFailure)

        if (id == null) {
            this.logger?.debug("User not found")
            return 0
        }

        const [rows] = await connection.execute("SELECT COUNT(*) AS count FROM Nicknames WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]
        const count  = rows[0].count

        this.logger?.debug(`Got: ${count}`)

        return count
    }

    async forceAddUserNickname(connection: Connection, user: User, nickname: string) {
        await this.addUserNickname(connection, user, nickname, {
            throwOnInvalidUser: true,
            throwOnLimit:       true,
            throwOnDuplicate:   true
        })
    }

    async addUserNickname(connection: Connection, user: User, nickname: string, options?: AddUserNicknameOptions): Promise<boolean> {
        this.logger?.debug(typeof user === "string" ? `Adding nickname "${nickname}" of user "${user}"...`
                                                    : `Adding nickname "${nickname}" of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, options?.throwOnInvalidUser)

        if (id == null)
            return false

        const count = await this.getUserNicknameCount(connection, id)

        if (count >= this.config.logicMaxNicknames) {
            const message = "Too many nicknames"

            if (options?.throwOnLimit)
                throw new LogicError(message)

            this.logger?.debug(message)

            return false
        }

        try {
            await connection.execute("INSERT INTO Nicknames (user_id, nickname) VALUES (?, ?)", [id, nickname])
        } catch (error) {
            if ((error as any).code !== "ER_DUP_ENTRY")
                throw error

            const message = `Nickname "${nickname}" already occupied`

            if (options?.throwOnDuplicate)
                throw new LogicError(message)

            this.logger?.debug(message)

            return false
        }

        this.logger?.debug("Added")

        return true
    }

    async forceGetUserNicknames(connection: Connection, user: User): Promise<string[]> {
        return await this.getUserNicknames(connection, user, true)
    }

    async getUserNicknames(connection: Connection, user: User, throwOnFailure: boolean = false): Promise<string[]> {
        this.logger?.debug(typeof user === "string" ? `Getting nicknames of user "${user}"...`
                                                    : `Getting nicknames of user with id ${user}...`)

        const id = await this.userManager.getUserId(connection, user, throwOnFailure)

        if (id == null)
            return []

        const [rows]    = await connection.execute("SELECT nickname FROM Nicknames WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]
        const nicknames = rows.map(row => row.nickname)

        this.logger?.debug(`Got: ${nicknames.map(n => `"${n}"`).join(", ")}`)

        return nicknames
    }
}