import Config                                     from "Config"

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

    addUserNickname(connection: Connection, user: User, nickname: string): Promise<boolean>

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
        return 0
    }

    async deleteAllNicknames(connection: Connection): Promise<number> {
        return 0
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
        return 0
    }

    async addUserNickname(connection: Connection, user: User, nickname: string): Promise<boolean> {
        return false
    }

    async getUserNicknames(connection: Connection, user: User, checkUser: boolean = false): Promise<string[]> {
        const id = await this.userManager.getUserId(connection, user, checkUser)

        if (id == null)
            return []

        const [rows] = await connection.execute("SELECT nickname FROM Nicknames WHERE user_id = ?", [id]) as [RowDataPacket[], FieldPacket[]]

        return rows.map(row => row.nickname)
    }
}