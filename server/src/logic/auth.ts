import Config                      from "Config"
import LogicError                  from "./LogicError"

import { Connection              } from "mysql2/promise"
import { Logger                  } from "winston"
import { TokenManager, TokenPair } from "./token"
import { UserManager             } from "./user"

export interface CreationOptions {
    readonly tokenManager: TokenManager
    readonly userManager:  UserManager
    readonly config:       Config
    readonly logger?:      Logger
}

export interface AuthManager {
    auth(connection: Connection, login: string, password: string): Promise<TokenPair>
    reauth(connection: Connection, rTokenId: Buffer): Promise<TokenPair>
    deauth(connection: Connection, aTokenId: Buffer): Promise<void>
}

export class DefaultAuthManager implements AuthManager {
    private reauthing: Set<string> = new Set()

    readonly tokenManager: TokenManager
    readonly userManager:  UserManager
    readonly config:       Config
    readonly logger?:      Logger

    constructor(options: CreationOptions) {
        this.tokenManager = options.tokenManager
        this.userManager  = options.userManager
        this.config       = options.config
        this.logger       = options.logger
    }

    async auth(connection: Connection, login: string, password: string): Promise<TokenPair> {
        this.logger?.debug(`Authenticating user "${login}"...`)

        const info      = await this.userManager.forceGetUserInfoByCredentials(connection, login, password)
        const maxTokens = this.config.read.logic.maxTokens

        await this.tokenManager.deleteUserExtraATokens(connection, info.id, maxTokens - 1)

        const pair = (await this.tokenManager.createUserTokenPair(connection, info.id))!

        this.logger?.debug("Athenticated")

        return pair
    }

    async reauth(connection: Connection, rTokenId: Buffer): Promise<TokenPair> {
        this.logger?.debug(`Reauthenticating token ${rTokenId.toString("hex")}...`)

        const rTokenIdString = rTokenId.toString("hex")

        if (this.reauthing.has(rTokenIdString))
            throw new LogicError("Already reauthenticating this token")

        this.reauthing.add(rTokenIdString)

        try {
            const rTokenInfo = await this.tokenManager.forceGetRTokenInfo(connection, rTokenId)

            if (rTokenInfo.exp <= new Date())
                throw new LogicError("Refresh token is too old")
            
            const { aTokenId } = rTokenInfo
            const aTokenInfo   = (await this.tokenManager.getATokenInfo(connection, aTokenId))!
            const pair         = (await this.tokenManager.createTokenPair(connection, aTokenInfo.userId))!

            await this.tokenManager.deleteAToken(connection, aTokenId) // Refresh token will be deleted cascade

            this.logger?.debug("Reathenticated")

            return pair
        } finally {
            this.reauthing.delete(rTokenIdString)
        }
    }

    async deauth(connection: Connection, aTokenId: Buffer) {
        this.logger?.debug(`Deauthenticating token ${aTokenId.toString("hex")}...`)
        await this.tokenManager.forceDeleteAToken(connection, aTokenId)
        this.logger?.debug("Deathenticated")
    }
}