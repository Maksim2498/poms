import AsyncConnection from "util/mysql/AsyncConnection"

import { NICKNAMES_TABLE                    } from "db-schema"
import { User, deleteAllUserData, getUserId } from "./user"

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

export async function getUserNicknames(connection: AsyncConnection, user: User): Promise<string[]> {
    const id      = await getUserId(connection, user)
    const results = await NICKNAMES_TABLE.select(connection).where("user_id = ?", id)

    return results.map(r => r.nickname)
}