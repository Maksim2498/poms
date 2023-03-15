import Config                      from "Config"

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
        return {} as TokenPair
    }

    async reauth(connection: Connection, rTokenId: Buffer): Promise<TokenPair> {
        return {} as TokenPair
    }

    async deauth(connection: Connection, aTokenId: Buffer) {

    }
}