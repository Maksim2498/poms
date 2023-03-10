import z          from "zod"
import isBase64   from "is-base64"
import Server     from "./Server"
import LogicError from "logic/LogicError"

import { Request, Response                         } from "express"
import { isHex                                     } from "./util/string"
import { auth, reauth                              } from "./logic/auth"

import { deleteUser,           createUser,
         deleteAllUsers,       getUserInfo,
         getDeepUserInfo,      getAllUsersDeepInfo } from "./logic/user"

import { getUserNicknames,     addNickname,
         deleteAllNicknames,   deleteUserNickname,
         getUserNicknameCount                      } from "logic/nickname"

import { checkATokenIsActive,  getATokenInfo,
         tokenPairToJson,      deleteAToken,
         ATokenInfo                                } from "./logic/token"

export type UnitCollection = {
    [key: string]: Unit
}

export interface Unit {
    permission?: Permission
    method:      Method
    path:        string
    handler:     Hander
}

export type Permission = "user" | "admin" | "mixed"
export type Method     = "get"  | "post"  | "put"   | "delete"
export type Hander     = (this: Server, req: Request, res: Response) => Promise<void>

export function requireAcceptJson(req: Request, res: Response, next: () => void) {
    if (req.accepts("json")) {
        next()
        return
    }

    res.sendStatus(406)
}

export function requireAuthorization(req: Request, res: Response, next: () => void) {
    if (req.headers.authorization != null) {
        next()
        return
    }

    res.sendStatus(401)
}

export function disableGetCache(req: Request, res: Response, next: () => void) {
    if (req.method === "GET")
        res.setHeader("Cache-Control", "no-cache")

    next()
}

export async function checkPermission(server: Server, permission: Permission, req: Request, res: Response, next: () => void) {
    const authorization = req.headers.authorization!

    if (!isHex(authorization)) {
        res.sendStatus(400)
        return
    }

    const aToken     = Buffer.from(authorization, "hex")
    const aTokenInfo = await getATokenInfo(server.mysqlConnection, aToken);

    (req as any).aTokenInfo = aTokenInfo

    switch (permission) {
        case "user": {
            await checkATokenIsActive(server.mysqlConnection, aTokenInfo)
            next()
            return
        }

        // Check if not an admin trying to modify other's data

        case "mixed": {
            await checkATokenIsActive(server.mysqlConnection, aTokenInfo)

            const user     = req.params.user
            const userInfo = (await getUserInfo(server.mysqlConnection, aTokenInfo!.userId))!

            if (userInfo.login !== user && !userInfo.isAdmin) {
                res.sendStatus(403)
                return
            }

            next()

            return
        }

        case "admin": {
            await checkATokenIsActive(server.mysqlConnection, aTokenInfo)

            const userInfo = (await getUserInfo(server.mysqlConnection, aTokenInfo!.userId))!

            if (!userInfo.isAdmin) {
                res.sendStatus(403)
                return
            }

            next()

            return
        }
    }
}

const ADD_USER_SCHEMA = z.object({
    password: z.string(),
    name:     z.string().optional(),
    isAdmin:  z.boolean().optional()
})

type AddUserOptions = z.infer<typeof ADD_USER_SCHEMA>

export const units: UnitCollection = {
    auth: {
        method: "post",
        path:   "/auth",

        async handler(req, res) {
            const splits = req.headers.authorization!.split(":")

            if (splits.length != 2) {
                res.sendStatus(400)
                return
            }

            const [base64Login, base64Password] = splits

            if (!isBase64(base64Login) || !isBase64(base64Password)) {
                res.sendStatus(400)
                return
            }

            const login     = Buffer.from(base64Login,    "base64").toString()
            const password  = Buffer.from(base64Password, "base64").toString()
            const tokenPair = await auth(this.mysqlConnection, login, password, { maxTokens: this.config.logicMaxTokens - 1 })

            res.json(tokenPairToJson(tokenPair))
        }
    },

    reauth: {
        method: "post",
        path:   "/reauth",

        async handler(req, res) {
            const authorization = req.headers.authorization!

            if (!isHex(authorization)) {
                res.sendStatus(400)
                return
            }

            const rToken = Buffer.from(authorization, "hex")

            if (rToken.length != 64) {
                res.sendStatus(400)
                return
            }

            const tokenPair = await reauth(this.mysqlConnection, rToken)

            res.json(tokenPairToJson(tokenPair))
        }
    },

    deauth: {
        method: "post",
        path:   "/deauth",

        async handler(req, res) {
            const authorization = req.headers.authorization!

            if (!isHex(authorization)) {
                res.sendStatus(400)
                return
            }

            const aToken = Buffer.from(authorization, "hex")

            if (aToken.length != 64) {
                res.sendStatus(400)
                return
            }

            await deleteAToken(this.mysqlConnection, aToken)
        
            res.json({})
        }
    },

    getAllUsers: {
        permission: "user",
        method:     "get",
        path:       "/users",

        async handler(req, res) {
            const user        = req.params.user
            const info        = await getAllUsersDeepInfo(this.mysqlConnection)
            const jsonsWithId = info.map(i => {
                return {
                    id: i.id,
                    json:  {
                        name:      i.name,
                        isAdmin:   i.isAdmin,
                        isOnline:  i.isOnline,
                        nicknames: null as null | string[],
                        reg:       {
                            time:  i.created.toISOString(),
                            login: i.creator?.login ?? null
                        }
                    }
                }
            })

            if ("nicknames" in req.query)
                for (const { id, json } of jsonsWithId)
                    json.nicknames = await getUserNicknames(this.mysqlConnection, id)

            res.json(jsonsWithId.map(j => j.json))
        }
    },

    getUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user",

        async handler(req, res) {
            const user = req.params.user
            const info = await getDeepUserInfo(this.mysqlConnection, user, true)
            const json = {
                name:      info.name,
                isAdmin:   info.isAdmin,
                isOnline:  info.isOnline,
                nicknames: null as null | string[],
                reg:       {
                    time:  info.created.toISOString(),
                    login: info.creator?.login ?? null
                }
            }

            if ("nicknames" in req.query)
                json.nicknames = await getUserNicknames(this.mysqlConnection, info.id)

            res.json(json)
        }
    },

    isUserAdmin: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-admin",

        async handler(req, res) {
            const user = req.params.user
            const info = await getUserInfo(this.mysqlConnection, user, true)
            
            res.json({ isAdmin: info.isAdmin })
        }
    },

    isUserOnline: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-online",

        async handler(req, res) {
            const user = req.params.user
            const info = await getUserInfo(this.mysqlConnection, user, true)
            
            res.json({ isOnline: info.isOnline })
        }
    },

    getUserReg: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg",

        async handler(req, res) {
            const user = req.params.user
            const info = await getDeepUserInfo(this.mysqlConnection, user, true)

            res.json({
                time:  info.created.toISOString(),
                login: info.creator?.login
            })
        }
    },

    getUserRegTime: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg/time",

        async handler(req, res) {
            const user = req.params.user
            const info = await getUserInfo(this.mysqlConnection, user, true)

            res.json({ time: info.created.toISOString() })
        }
    },

    getUserRegUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg/user",

        async handler(req, res) {
            const user = req.params.user
            const info = await getDeepUserInfo(this.mysqlConnection, user, true)

            res.json({ login: info.creator?.login })
        }
    },

    getUserName: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/name",

        async handler(req, res) {
            const user = req.params.user
            const info = await getUserInfo(this.mysqlConnection, user, true)

            res.json({ name: info.name })
        }
    },

    getUserNicknames: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/nicknames",

        async handler(req, res) {
            const user      = req.params.user
            const nicknames = await getUserNicknames(this.mysqlConnection, user)

            res.json(nicknames)
        }
    },

    getServerStatus: {
        permission: "user",
        method:     "get",
        path:       "/server",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json(status)
        }
    },

    getServerVersion: {
        permission: "user",
        method:     "get",
        path:       "/server/version",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerVersionName: {
        permission: "user",
        method:     "get",
        path:       "/server/version/name",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerVersionProtocol: {
        permission: "user",
        method:     "get",
        path:       "/server/version/protocol",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerPlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerPlayersCount: {
        permission: "user",
        method:     "get",
        path:       "/server/players/count",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerOnlinePlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players/online",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerMaxPlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players/max",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerPlayersSample: {
        permission: "user",
        method:     "get",
        path:       "/server/players/sample",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerRawMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/raw",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerCleanMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/clean",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerHtmlMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/html",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getServerFavicon: {
        permission: "user",
        method:     "get",
        path:       "/server/favicon",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteAllUsers: {
        permission: "admin",
        method:     "delete",
        path:       "/users",

        async handler(req, res) {
            await deleteAllUsers(this.mysqlConnection)
            res.json({})
        }
    },

    deleteUser: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user",

        async handler(req, res) {
            const user = req.params.user
            await deleteUser(this.mysqlConnection, user)
            res.json({})
        }
    },

    deleteAllUserNicknames: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user/nicknames",

        async handler(req, res) {
            const user = req.params.user
            await deleteAllNicknames(this.mysqlConnection, user)
            res.json({})
        }
    },

    deleteUserNickname: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user/nicknames/:nickname",

        async handler(req, res) {
            const user     = req.params.user
            const nickname = req.params.user

            await deleteUserNickname(this.mysqlConnection, user, nickname)

            res.json({})
        }
    },

    updateUserName: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/name",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    updateUserPassword: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/password",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    updateUserPermissions: {
        permission: "admin",
        method:     "put",
        path:       "/users/:user/is-admin",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    addUserNickname: {
        permission: "mixed",
        method:     "post",
        path:       "/users/:user/nicknames/:nickname",

        async handler(req, res) {
            const user = req.params.user
            const max  = this.config.logicMaxNicknames
            const has  = await getUserNicknameCount(this.mysqlConnection, user)

            if (has >= max)
                throw new LogicError("Too many nicknames")

            const nickname = req.params.nickname

            await addNickname(this.mysqlConnection, user, nickname)

            res.json({})
        }
    },

    addUser: {
        permission: "admin",
        method:     "post",
        path:       "/users/:user",

        async handler(req, res) {
            const json        = req.body
            const parseResult = ADD_USER_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { password, name, isAdmin } = parseResult.data
            const aTokenInfo                  = (req as any).aTokenInfo as ATokenInfo
            const creatorId                   = aTokenInfo.userId
            const login                       = req.params.user
        
            await createUser({
                connection: this.mysqlConnection,
                login:      login,
                password:   password,
                name:       name,
                isAdmin:    isAdmin,
                creator:    creatorId,
                force:      true
            })
        
            res.json({})
        }
    }
}