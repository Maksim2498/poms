import LogicError                       from "./LogicError"
import UserManager                      from "./UserManager"

import { NICKNAMES_TABLE, USERS_TABLE } from "tables"
import { User, UserInfo               } from "./UserManager"

export default class NicknameManager {
    readonly userManager: UserManager

    constructor(userManager: UserManager) {
        this.userManager = userManager
    }

    async deleteAllNicknames(user?: User) {
        await this.userManager.deleteAllUserData(NICKNAMES_TABLE, user)
    }

    async deleteNickname(nickname: string) {
        await NICKNAMES_TABLE.delete(this.userManager.mysqlConnection)
                             .where("nickname = ?", nickname)
    }

    async getNicknameOwnerInfo(nickname: string, force:  true):            Promise<UserInfo>
    async getNicknameOwnerInfo(nickname: string, force?: boolean):         Promise<UserInfo | undefined>
    async getNicknameOwnerInfo(nickname: string, force:  boolean = false): Promise<UserInfo | undefined> {
        const results = await NICKNAMES_TABLE.join(this.userManager.mysqlConnection, "n", USERS_TABLE, "u", "n.user_id = u.id")
                                             .where("n.nickname = ?", nickname)

        if (!results.length) {
            if (force)
                NicknameManager.missingNicknameOwner(nickname)

            return undefined
        }

        const { u } = results[0]

        return {
            id:           u.id,
            login:        u.login,
            name:         u.name,
            passwordHash: u.password_hash,
            isAdmin:      !!u.is_admin,
            isOnline:     !!u.is_online,
            created:      u.cr_time,
            creator:      u.cr_id
        }

    }

    async getNicknameOwnerId(nickname: string, force:  true):            Promise<number>
    async getNicknameOwnerId(nickname: string, force?: boolean):         Promise<number | undefined>
    async getNicknameOwnerId(nickname: string, force:  boolean = false): Promise<number | undefined> {
        const results = await NICKNAMES_TABLE.select(this.userManager.mysqlConnection, "user_id")
                                             .where("nickname = ?", nickname)

        if (!results.length) {
            if (force)
                NicknameManager.missingNicknameOwner(nickname)

            return undefined
        }

        return results[0].user_id
    }

    async deleteUserNickname(user: User, nickname: string) {
        const id = await this.userManager.getUserId(user)

        await NICKNAMES_TABLE.delete(this.userManager.mysqlConnection)
                             .where("user_id = ? and nickname = ?", id, nickname)
    }

    async getUserNicknameCount(user: User): Promise<number> {
        const id      = await this.userManager.getUserId(user)
        const results = await NICKNAMES_TABLE.unsafeSelect(this.userManager.mysqlConnection, "count(*) as count")
                                             .where("user_id = ?", id)

        return results[0]?.count ?? 0
    }

    async addNickname(user: User, nickname: string) {
        const id = await this.userManager.getValidUserId(user)

        await NICKNAMES_TABLE.insert(this.userManager.mysqlConnection, {
            user_id:  id,
            nickname: nickname
        })
    }

    async getUserNicknames(user: User): Promise<string[]> {
        const id      = await this.userManager.getUserId(user)
        const results = await NICKNAMES_TABLE.select(this.userManager.mysqlConnection)
                                             .where("user_id = ?", id)

        return results.map(r => r.nickname)
    }

    private static missingNicknameOwner(nickname: string) {
        throw new LogicError(`There is no user owning nickname "${nickname}"`)
    }
}