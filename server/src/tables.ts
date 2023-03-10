import Table                                           from "./util/mysql/Table"

import { ReadonlyTable, CURRENT_TIMESTAMP            } from "./util/mysql/Table"
import { bigint, varchar, binary, timestamp, boolean } from "./util/mysql/type"

const usersTable = new Table("Users")
    .addColumn({ name: "id",            type: bigint(),     primaryKey:   true, autoIncrement: true })
    .addColumn({ name: "login",         type: varchar(255), unique:       true                      })
    .addColumn({ name: "name",          type: varchar(255), nullable:     true                      })
    .addColumn({ name: "cr_id",         type: bigint(),     nullable:     true                      })
    .addColumn({ name: "cr_time",       type: timestamp(),  defaultValue: CURRENT_TIMESTAMP         })
    .addColumn({ name: "password_hash", type: binary(64)                                            })
    .addColumn({ name: "is_admin",      type: boolean(),    defaultValue: false                     })
    .addColumn({ name: "is_online",     type: boolean(),    defaultValue: false                     })

usersTable.addForeignKey("cr_id", usersTable, "id", "null")

const nicknamesTable = new Table("Nicknames")
    .addColumn({ name: "user_id",  type: bigint()                   })
    .addColumn({ name: "nickname", type: varchar(255), unique: true })
    .addForeignKey("user_id", usersTable, "id")
    .addPrimaryKey("user_id", "nickname")

const aTokensTable = new Table("ATokens")
    .addColumn({ name: "id",       type: binary(64),  primaryKey:   true              })
    .addColumn({ name: "user_id",  type: bigint()                                     })
    .addColumn({ name: "exp_time", type: timestamp(), nullable:     true              })
    .addColumn({ name: "cr_time",  type: timestamp(), defaultValue: CURRENT_TIMESTAMP })
    .addForeignKey("user_id", usersTable, "id")

const rTokensTable = new Table("RTokens")
    .addColumn({ name: "id",        type: binary(64),  primaryKey:   true              })
    .addColumn({ name: "atoken_id", type: binary(64)                                   })
    .addColumn({ name: "exp_time",  type: timestamp(), nullable:     true              })
    .addColumn({ name: "cr_time",   type: timestamp(), defaultValue: CURRENT_TIMESTAMP })
    .addForeignKey("atoken_id", aTokensTable, "id")

export const USERS_TABLE:     ReadonlyTable = usersTable
export const NICKNAMES_TABLE: ReadonlyTable = nicknamesTable
export const A_TOKENS_TABLE:  ReadonlyTable = aTokensTable
export const R_TOKENS_TABLE:  ReadonlyTable = rTokensTable