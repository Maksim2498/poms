import AsyncConnection from "util/mysql/AsyncConnection"

import { NICKNAMES_TABLE         } from "db-schema"
import { User, deleteAllUserData } from "./user"

export async function deleteAllNicknames(connection: AsyncConnection, user?: User) {
    await deleteAllUserData(connection, NICKNAMES_TABLE, user)
}