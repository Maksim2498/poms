import AsyncConnection from "util/mysql/AsyncConnection"

import { NICKNAMES_TABLE                                    } from "db-schema"
import { User, deleteAllUserData, getUserId, getValidUserId } from "./user"

export async function deleteAllNicknames(connection: AsyncConnection, user?: User) {
    await deleteAllUserData(connection, NICKNAMES_TABLE, user)
}

export async function deleteNickname(connection: AsyncConnection, nickname: string) {
    await NICKNAMES_TABLE.delete(connection).where("nickname = ?", nickname)
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