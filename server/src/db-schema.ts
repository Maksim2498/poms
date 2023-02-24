import Table, * as t from "./util/mysql/Table"

const usersTable = new Table("Users")
    .addColumn({ name: "id",            type: t.bigint(),     primaryKey:   true, autoIncrement: true })
    .addColumn({ name: "login",         type: t.varchar(255), unique:       true                      })
    .addColumn({ name: "name",          type: t.varchar(255), nullable:     true                      })
    .addColumn({ name: "cr_id",         type: t.bigint(),     nullable:     true                      })
    .addColumn({ name: "cr_time",       type: t.timestamp(),  defaultValue: t.CURRENT_TIMESTAMP       })
    .addColumn({ name: "password_hash", type: t.binary(64)                                            })
    .addColumn({ name: "is_admin",      type: t.boolean(),    defaultValue: false                     })
    .addColumn({ name: "is_online",     type: t.boolean(),    defaultValue: false                     })

usersTable.addForeignKey("cr_id", usersTable, "id", "null")

const nicknamesTable = new Table("Nicknames")
    .addColumn({ name: "user_id",  type: t.bigint()                   })
    .addColumn({ name: "nickname", type: t.varchar(255), unique: true })
    .addForeignKey("user_id", usersTable, "id")
    .addPrimaryKey("user_id", "nickname")

const tokensTable = new Table("Tokens")
    .addColumn({ name: "id",       type: t.binary(64),  primaryKey: true                  })
    .addColumn({ name: "user_id",  type: t.bigint()                                       })
    .addColumn({ name: "exp_time", type: t.timestamp(), nullable: true                    })
    .addColumn({ name: "cr_time",  type: t.timestamp(), defaultValue: t.CURRENT_TIMESTAMP })
    .addColumn({ name: "type",     type: t.enumeration("access", "refresh")               })
    .addForeignKey("user_id", usersTable, "id")

export const USERS_TABLE:     t.ReadonlyTable = usersTable
export const NICKNAMES_TABLE: t.ReadonlyTable = nicknamesTable
export const TOKENS_TABLE:    t.ReadonlyTable = tokensTable