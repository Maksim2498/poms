import AsyncConnection from "util/mysql/AsyncConnection"
import LogicError      from "./LogicError"

import { NICKNAMES_TABLE, USERS_TABLE                                 } from "tables"
import { UserInfo, User, deleteAllUserData, getUserId, getValidUserId } from "./user"

export async function deleteAllNicknames(connection: AsyncConnection, user?: User) {
    await deleteAllUserData(connection, NICKNAMES_TABLE, user)
}

export async function deleteNickname(connection: AsyncConnection, nickname: string) {
    await NICKNAMES_TABLE.delete(connection).where("nickname = ?", nickname)
}

export async function getNicknameOwnerInfo(conneciton: AsyncConnection, nickname: string, force:  true):            Promise<UserInfo>
export async function getNicknameOwnerInfo(conneciton: AsyncConnection, nickname: string, force?: boolean):         Promise<UserInfo | undefined>
export async function getNicknameOwnerInfo(conneciton: AsyncConnection, nickname: string, force:  boolean = false): Promise<UserInfo | undefined> {
    const results = await NICKNAMES_TABLE.join(conneciton, "n", USERS_TABLE, "u", "n.user_id = u.id")
                                         .where("n.nickname = ?", nickname)

    if (!results.length) {
        if (force)
            missingNicknameOwner(nickname)

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

export async function getNicknameOwnerId(conneciton: AsyncConnection, nickname: string, force:  true):            Promise<number>
export async function getNicknameOwnerId(conneciton: AsyncConnection, nickname: string, force?: boolean):         Promise<number | undefined>
export async function getNicknameOwnerId(conneciton: AsyncConnection, nickname: string, force:  boolean = false): Promise<number | undefined> {
    const results = await NICKNAMES_TABLE.select(conneciton, "user_id").where("nickname = ?", nickname)

    if (!results.length) {
        if (force)
            missingNicknameOwner(nickname)

        return undefined
    }

    return results[0].user_id
}

export async function deleteUserNickname(connection: AsyncConnection, user: User, nickname: string) {
    const id = await getUserId(connection, user)

    await NICKNAMES_TABLE.delete(connection)
                         .where("user_id = ? and nickname = ?", id, nickname)
}

export async function getUserNicknameCount(connection: AsyncConnection, user: User): Promise<number> {
    const id      = await getUserId(connection, user)
    const results =  await NICKNAMES_TABLE.unsafeSelect(connection, "count(*) as count")
                                          .where("user_id = ?", id)

    return results[0]?.count ?? 0
}

export async function addNickname(conneciton: AsyncConnection, user: User, nickname: string) {
    const id = await getValidUserId(conneciton, user)

    await NICKNAMES_TABLE.insert(conneciton, {
        user_id:  id,
        nickname: nickname
    })
}

export async function getUserNicknames(connection: AsyncConnection, user: User): Promise<string[]> {
    const id      = await getUserId(connection, user)
    const results = await NICKNAMES_TABLE.select(connection).where("user_id = ?", id)

    return results.map(r => r.nickname)
}

function missingNicknameOwner(nickname: string) {
    throw new LogicError(`There is no user owning nickname "${nickname}"`)
}