import z                                                   from "zod"
import isBase64                                            from "is-base64"
import Server                                              from "./Server"

import { Request, Response                               } from "express"
import { Connection                                      } from "mysql2/promise"
import { parseTokenId, safeParseTokenId, tokenPairToJson } from "./logic/token"

export type UnitCollection = {
    [key: string]: Unit
}

export interface Unit {
    permission?: Permission
    method:      Method
    path:        string
    handler:     Hander
}

export type Permission = "admin"
                       | "mixed"
                       | "user"

export type Method = "delete"
                   | "post"
                   | "get"
                   | "put"

export type Hander = ConnectedHandler
                   | DisconnectedHandler

export type ConnectedHandler = (this: Server, connection: Connection, req: Request, res: Response) => Promise<void>

export type DisconnectedHandler = (this: Server, req: Request, res: Response) => Promise<void>

export function requireAcceptJson(req: Request, res: Response, next: () => void) {
    if (req.accepts("json")) {
        next()
        return
    }

    res.sendStatus(406)
}

export function disableGetCache(req: Request, res: Response, next: () => void) {
    if (req.method === "GET")
        res.setHeader("Cache-Control", "no-cache")

    next()
}

export async function checkPermission(this: Server, permission: Permission, req: Request, res: Response) {
    if (this.config.logicAllowAnonymousAccess && permission === "user")
        return

    const authorization = req.headers.authorization

    if (authorization == null) {
        res.sendStatus(401)
        return
    }

    const aTokenId = safeParseTokenId(authorization)

    if (aTokenId === undefined) {
        res.sendStatus(400)
        return
    }

    const connection = await this.pool.getConnection()
    
    try {
        await connection.beginTransaction()

        const tokenManager = this.tokenManager
        const aTokenInfo   = await tokenManager.getATokenInfo(connection, aTokenId);

        switch (permission) {
            case "user":
                await tokenManager.checkATokenIsActive(connection, aTokenInfo)
                break

            // Check if not an admin trying to modify other's data

            case "mixed": {
                await tokenManager.checkATokenIsActive(connection, aTokenInfo)

                const userManager     = this.userManager
                const reqUserId       = aTokenInfo!.userId
                const reqUserInfo     = await userManager.getUserInfo(connection, reqUserId, true)
                const reqUserLogin    = reqUserInfo.login.toLowerCase()
                const targetUserLogin = req.params.user.toLowerCase()
                const isReqUserAdmin  = reqUserInfo.isAdmin

                if (reqUserLogin !== targetUserLogin && !isReqUserAdmin)
                    res.sendStatus(403)
            }

            case "admin": {
                await tokenManager.checkATokenIsActive(connection, aTokenInfo)

                const userManager = this.userManager
                const userId      = aTokenInfo!.userId
                const userInfo    = await userManager.getUserInfo(connection, userId, true)

                if (!userInfo.isAdmin)
                    res.sendStatus(403)
            }
        }

        await connection.commit()
    } finally {
        connection.release()
    }
}

const ADD_USER_SCHEMA = z.object({
    password: z.string(),
    name:     z.ostring(),
    isAdmin:  z.oboolean()
})

const UPDATE_USER_NAME_SCHEMA = z.object({
    name: z.string().nullable()
})

const UPDATE_USER_PASSWORD_SCHEMA = z.object({
    password: z.string()
})

const UPDATE_USER_PERMISSION_SCHEMA = z.object({
    isAdmin: z.boolean()
})

export const units: UnitCollection = {
    // Temporary
    test: {
        method: "get",
        path:   "/test/:nickname",

        async handler(connection, req, res) {
            const info = await this.nicknameManager.getNicknameOwnerInfo(connection, req.params.nickname, true)
            res.json(info)
        }
    },

    isAnonymousAccessAllowed: {
        method: "get",
        path:   "/anonym-access-allowed",

        async handler(this: Server, req: Request, res: Response) {
            const allowed = this.config.logicAllowAnonymousAccess
            res.json({ allowed })
        }
    },

    getMaxNicknames: {
        permission: "user",
        method:     "get",
        path:       "/max-nicknames",

        async handler(this: Server, req: Request, res: Response) {
            const max = this.config.logicMaxNicknames
            res.json({ max })
        }
    },

    getMaxTokens: {
        permission: "user",
        method:     "get",
        path:       "/max-tokens",

        async handler(this: Server, req: Request, res: Response) {
            const max = this.config.logicMaxTokens
            res.json({ max })
        }
    },

    auth: {
        method: "post",
        path:   "/auth",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const authorization = req.headers.authorization

            if (authorization == null) {
                res.sendStatus(401)
                return
            }

            const splits = authorization.split(":")

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
            const tokenPair = await this.authManager.auth(connection, login, password)
            const json      = tokenPairToJson(tokenPair)

            res.json(json)
        }
    },

    reauth: {
        method: "post",
        path:   "/reauth",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const authorization = req.headers.authorization
            
            if (authorization == null) {
                res.sendStatus(401)
                return
            }

            const rTokenId = safeParseTokenId(authorization)

            if (rTokenId === undefined) {
                res.sendStatus(400)
                return
            }

            const tokenPair = await this.authManager.reauth(connection, rTokenId)
            const json      = tokenPairToJson(tokenPair)

            res.json(json)
        }
    },

    deauth: {
        method: "post",
        path:   "/deauth",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const authorization = req.headers.authorization

            if (authorization == null) {
                res.sendStatus(401)
                return
            }

            const aTokenId = safeParseTokenId(authorization)

            if (aTokenId === undefined) {
                res.sendStatus(400)
                return
            }
            
            await this.authManager.deauth(connection, aTokenId)
        
            res.json({})
        }
    },

    getAllUsers: {
        permission: "user",
        method:     "get",
        path:       "/users",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const info        = await this.userManager.getAllUsersDeepInfo(connection)
            const jsonsWithId = info.map(i => {
                return {
                    id:            i.id,
                    json:          {
                        login:     i.login,
                        name:      i.name,
                        isAdmin:   i.isAdmin,
                        isOnline:  i.isOnline,
                        nicknames: null as null | string[],
                        reg:       {
                            time:  i.created.toISOString(),
                            login: i.creatorInfo?.login ?? null
                        }
                    }
                }
            })

            if ("nicknames" in req.query)
                for (const { id, json } of jsonsWithId)
                    json.nicknames = await this.nicknameManager.getUserNicknames(connection, id)

            res.json(jsonsWithId.map(j => j.json))
        }
    },

    getUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getDeepUserInfo(connection, user, true)
            const json = {
                login:     info.login,
                name:      info.name,
                isAdmin:   info.isAdmin,
                isOnline:  info.isOnline,
                nicknames: null as null | string[],
                reg:       {
                    time:  info.created.toISOString(),
                    login: info.creatorInfo?.login ?? null
                }
            }

            if ("nicknames" in req.query)
                json.nicknames = await this.nicknameManager.getUserNicknames(connection, info.id)

            res.json(json)
        }
    },

    getUserLogin: {
        permission: "user",
        method:     "get",
        path:       "/users/:user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getDeepUserInfo(connection, user, true)

            res.json({ login: info.login })
        }
    },

    isUserAdmin: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-admin",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getUserInfo(connection, user, true)
            
            res.json({ isAdmin: info.isAdmin })
        }
    },

    isUserOnline: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-online",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getUserInfo(connection, user, true)
            
            res.json({ isOnline: info.isOnline })
        }
    },

    getUserReg: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getDeepUserInfo(connection, user, true)

            res.json({
                time:  info.created.toISOString(),
                login: info.creatorInfo?.login
            })
        }
    },

    getUserRegTime: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg/time",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getUserInfo(connection, user, true)

            res.json({ time: info.created.toISOString() })
        }
    },

    getUserRegUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg/user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getDeepUserInfo(connection, user, true)

            res.json({ login: info.creatorInfo?.login })
        }
    },

    getUserName: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/name",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.getUserInfo(connection, user, true)

            res.json({ name: info.name })
        }
    },

    getUserNicknames: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/nicknames",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user      = req.params.user
            const nicknames = await this.nicknameManager.getUserNicknames(connection, user, true)

            res.json(nicknames)
        }
    },

    getServerStatus: {
        permission: "user",
        method:     "get",
        path:       "/server",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json(status)
        }
    },

    getServerVersion: {
        permission: "user",
        method:     "get",
        path:       "/server/version",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json(status.version)
        }
    },

    getServerVersionName: {
        permission: "user",
        method:     "get",
        path:       "/server/version/name",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ name: status.version.name })
        }
    },

    getServerVersionProtocol: {
        permission: "user",
        method:     "get",
        path:       "/server/version/protocol",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ protocol: status.version.protocol })
        }
    },

    getServerPlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json(status.players)
        }
    },

    getServerPlayersCount: {
        permission: "user",
        method:     "get",
        path:       "/server/players/count",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)

            res.json({
                online: status.players.online,
                max:    status.players.max
            })
        }
    },

    getServerOnlinePlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players/online",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ online: status.players.online })
        }
    },

    getServerMaxPlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players/max",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ max: status.players.max })
        }
    },

    getServerPlayersSample: {
        permission: "user",
        method:     "get",
        path:       "/server/players/sample",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json(status.players.sample)
        }
    },

    getServerMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json(status.motd)
        }
    },

    getServerRawMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/raw",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ raw: status.motd.raw })
        }
    },

    getServerCleanMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/clean",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ clean: status.motd.clean })
        }
    },

    getServerHtmlMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/html",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ html: status.motd.html })
        }
    },

    getServerFavicon: {
        permission: "user",
        method:     "get",
        path:       "/server/favicon",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status = await this.statusFetcher.fetch(connection)
            res.json({ favicon: status.favicon })
        }
    },

    deleteAllUsers: {
        permission: "admin",
        method:     "delete",
        path:       "/users",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const count = await this.userManager.deleteAllUsers(connection)
            res.json({ count })
        }
    },

    deleteUser: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            await this.userManager.deleteUser(connection, user, true)
            res.json({})
        }
    },

    deleteAllUserNicknames: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user/nicknames",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user  = req.params.user
            const count = await this.nicknameManager.deleteAllUserNicknames(connection, user, true)

            res.json({ count })
        }
    },

    deleteUserNickname: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user/nicknames/:nickname",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user     = req.params.user
            const nickname = req.params.user

            await this.nicknameManager.deleteUserNickname(connection, user, nickname, {
                checkNickname: true,
                checkUser:     true
            })

            res.json({})
        }
    },

    updateUserName: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/name",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json        = req.body
            const parseResult = UPDATE_USER_NAME_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { name } = parseResult.data
            const user     = req.params.user

            await this.userManager.setUserName(connection, user, name, true)

            res.json({})
        }
    },

    updateUserPassword: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/password",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json        = req.body
            const parseResult = UPDATE_USER_PASSWORD_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { password } = parseResult.data
            const user         = req.params.user

            await this.userManager.setUserPassword(connection, user, password, true)
            await this.tokenManager.deleteAllUserATokens(connection, user)

            res.json({})
        }
    },

    updateUserPermissions: {
        permission: "admin",
        method:     "put",
        path:       "/users/:user/is-admin",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json        = req.body
            const parseResult = UPDATE_USER_PERMISSION_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { isAdmin } = parseResult.data
            const user        = req.params.user

            await this.userManager.setUserPermission(connection, user, isAdmin, true)

            res.json({})
        }
    },

    addUserNickname: {
        permission: "mixed",
        method:     "post",
        path:       "/users/:user/nicknames/:nickname",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user     = req.params.user
            const nickname = req.params.nickname

            await this.nicknameManager.addUserNickname(connection, user, nickname)

            res.json({})
        }
    },

    addUser: {
        permission: "admin",
        method:     "post",
        path:       "/users/:user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json        = req.body
            const parseResult = ADD_USER_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { password, name, isAdmin } = parseResult.data
            const authorization               = req.headers.authorization!
            const aTokenId                    = parseTokenId(authorization)
            const aTokenInfo                  = await this.tokenManager.getATokenInfo(connection, aTokenId, true)
            const creatorId                   = aTokenInfo.userId
            const login                       = req.params.user
        
            await this.userManager.createUser(connection, {
                login:    login,
                password: password,
                name:     name,
                isAdmin:  isAdmin,
                creator:  creatorId,
                force:    true
            })
        
            res.json({})
        }
    }
}