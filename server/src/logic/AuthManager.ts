import TokenManager  from "./TokenManager"
import LogicError    from "./LogicError"

import { TokenPair } from "./TokenManager"

export default class AuthManager {
    readonly tokenManager: TokenManager

    constructor(tokenManager: TokenManager) {
        this.tokenManager = tokenManager
    }

    async auth(login: string, password: string): Promise<TokenPair> {
        const userManager = this.tokenManager.userManager
        const userId      = await userManager.getUserIdByCredentials(login, password)
        const config      = userManager.config
        const maxTokens   = config.logicMaxTokens

        await this.tokenManager.deleteUserExtraATokens(userId, maxTokens - 1)

        return await this.tokenManager.createTokenPair(userId)
    }

    async reauth(rTokenId: Buffer): Promise<TokenPair> {
        const rTokenInfo = await this.tokenManager.getRTokenInfo(rTokenId, true)

        if (rTokenInfo.exp <= new Date())
            throw new LogicError("Token is too old")

        const aTokenInfo = await this.tokenManager.getATokenInfo(rTokenInfo.aTokenId, true)
        
        await this.tokenManager.deleteAToken(aTokenInfo.id) // Refresh token will be deleted cascade
        
        return await this.tokenManager.createTokenPair(aTokenInfo.userId)
    }

    async deauth(aTokenId: Buffer) {
        this.tokenManager.deleteAToken(aTokenId)
    }
}