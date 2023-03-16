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
        const info      = await this.userManager.getUserInfoByCredentials(connection, login, password, true)
        const maxTokens = this.config.logicMaxTokens

        await this.tokenManager.deleteUserExtraATokens(connection, info.id, maxTokens - 1)

        return await this.tokenManager.createTokenPair(connection, info.id)
    }

    async reauth(connection: Connection, rTokenId: Buffer): Promise<TokenPair> {
        const rTokenInfo = await this.tokenManager.getRTokenInfo(connection, rTokenId, true)

        if (rTokenInfo.exp <= new Date())
            throw new LogicError("Token is too old")

        const aTokenInfo = (await this.tokenManager.getATokenInfo(connection, rTokenInfo.aTokenId))!
        
        await this.tokenManager.deleteAToken(connection, aTokenInfo.id) // Refresh token will be deleted cascade
        
        return await this.tokenManager.createTokenPair(connection, aTokenInfo.userId)
    }

    async deauth(connection: Connection, aTokenId: Buffer) {
        await this.tokenManager.deleteAToken(connection, aTokenId, true)
    }
}