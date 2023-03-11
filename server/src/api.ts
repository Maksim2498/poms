import z                     from "zod"
import isBase64              from "is-base64"
import LogicError            from "./logic/LogicError"
import TokenManager          from "./logic/TokenManager"
import Server                from "./Server"

import { Request, Response } from "express"
import { ATokenInfo        } from "./logic/TokenManager"

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
    const tokenManager  = server.tokenManager
    const userManager   = server.userManager
    const aTokenId      = TokenManager.tryCreateTokenIdFromString(authorization)

    if (aTokenId === undefined) {
        res.sendStatus(400)
        return
    }

    const aTokenInfo = await tokenManager.getATokenInfo(aTokenId);

    (req as any).aTokenInfo = aTokenInfo

    switch (permission) {
        case "user": {
            await tokenManager.checkATokenIsActive(aTokenInfo)
            next()
            return
        }

        // Check if not an admin trying to modify other's data

        case "mixed": {
            await tokenManager.checkATokenIsActive(aTokenInfo)

            const user     = req.params.user
            const userInfo = (await userManager.getUserInfo(aTokenInfo!.userId))!

            if (userInfo.login !== user && !userInfo.isAdmin) {
                res.sendStatus(403)
                return
            }

            next()

            return
        }

        case "admin": {
            await tokenManager.checkATokenIsActive(aTokenInfo)

            const userInfo = (await userManager.getUserInfo(aTokenInfo!.userId))!

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
            const tokenPair = await this.authManager.auth(login, password)
            const json      = TokenManager.tokenPairToJson(tokenPair)

            res.json(json)
        }
    },

    reauth: {
        method: "post",
        path:   "/reauth",

        async handler(req, res) {
            const authorization = req.headers.authorization!
            const rTokenId      = TokenManager.tryCreateTokenIdFromString(authorization)

            if (rTokenId === undefined) {
                res.sendStatus(400)
                return
            }

            const tokenPair = await this.authManager.reauth(rTokenId)
            const json      = TokenManager.tokenPairToJson(tokenPair)

            res.json(json)
        }
    },

    deauth: {
        method: "post",
        path:   "/deauth",

        async handler(req, res) {
            const authorization = req.headers.authorization!
            const aTokenId      = TokenManager.tryCreateTokenIdFromString(authorization)

            if (aTokenId === undefined) {
                res.sendStatus(400)
                return
            }
            
            await this.authManager.deauth(aTokenId)
        
            res.json({})
        }
    },

    getAllUsers: {
        permission: "user",
        method:     "get",
        path:       "/users",

        async handler(req, res) {
            const user        = req.params.user
            const info        = await this.userManager.getAllUsersDeepInfo()
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
                    json.nicknames = await this.nicknameManager.getUserNicknames(id)

            res.json(jsonsWithId.map(j => j.json))
        }
    },

    getUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user",

        async handler(req, res) {
            const user = req.params.user
            const info = await this.userManager.getDeepUserInfo(user, true)
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
                json.nicknames = await this.nicknameManager.getUserNicknames(info.id)

            res.json(json)
        }
    },

    isUserAdmin: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-admin",

        async handler(req, res) {
            const user = req.params.user
            const info = await this.userManager.getUserInfo(user, true)
            
            res.json({ isAdmin: info.isAdmin })
        }
    },

    isUserOnline: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-online",

        async handler(req, res) {
            const user = req.params.user
            const info = await this.userManager.getUserInfo(user, true)
            
            res.json({ isOnline: info.isOnline })
        }
    },

    getUserReg: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg",

        async handler(req, res) {
            const user = req.params.user
            const info = await this.userManager.getDeepUserInfo(user, true)

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
            const info = await this.userManager.getUserInfo(user, true)

            res.json({ time: info.created.toISOString() })
        }
    },

    getUserRegUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg/user",

        async handler(req, res) {
            const user = req.params.user
            const info = await this.userManager.getDeepUserInfo(user, true)

            res.json({ login: info.creator?.login })
        }
    },

    getUserName: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/name",

        async handler(req, res) {
            const user = req.params.user
            const info = await this.userManager.getUserInfo(user, true)

            res.json({ name: info.name })
        }
    },

    getUserNicknames: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/nicknames",

        async handler(req, res) {
            const user      = req.params.user
            const nicknames = await this.nicknameManager.getUserNicknames(user)

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
            const status = await this.statusFetcher.fetch()
            res.json(status.version)
        }
    },

    getServerVersionName: {
        permission: "user",
        method:     "get",
        path:       "/server/version/name",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ name: status.version.name })
        }
    },

    getServerVersionProtocol: {
        permission: "user",
        method:     "get",
        path:       "/server/version/protocol",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ protocol: status.version.protocol })
        }
    },

    getServerPlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json(status.players)
        }
    },

    getServerPlayersCount: {
        permission: "user",
        method:     "get",
        path:       "/server/players/count",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()

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

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ online: status.players.online })
        }
    },

    getServerMaxPlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players/max",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ max: status.players.max })
        }
    },

    getServerPlayersSample: {
        permission: "user",
        method:     "get",
        path:       "/server/players/sample",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json(status.players.sample)
        }
    },

    getServerMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json(status.motd)
        }
    },

    getServerRawMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/raw",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ raw: status.motd.raw })
        }
    },

    getServerCleanMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/clean",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ clean: status.motd.clean })
        }
    },

    getServerHtmlMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/html",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ html: status.motd.html })
        }
    },

    getServerFavicon: {
        permission: "user",
        method:     "get",
        path:       "/server/favicon",

        async handler(req, res) {
            const status = await this.statusFetcher.fetch()
            res.json({ favicon: status.favicon })
        }
    },

    deleteAllUsers: {
        permission: "admin",
        method:     "delete",
        path:       "/users",

        async handler(req, res) {
            await this.userManager.deleteAllUsers()
            res.json({})
        }
    },

    deleteUser: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user",

        async handler(req, res) {
            const user = req.params.user
            await this.userManager.deleteUser(user)
            res.json({})
        }
    },

    deleteAllUserNicknames: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user/nicknames",

        async handler(req, res) {
            const user = req.params.user
            await this.nicknameManager.deleteAllNicknames(user)
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

            await this.nicknameManager.deleteUserNickname(user, nickname)

            res.json({})
        }
    },

    updateUserName: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/name",

        async handler(req, res) {
            const json        = req.body
            const parseResult = UPDATE_USER_NAME_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { name } = parseResult.data
            const user     = req.params.user

            await this.userManager.setUserName(user, name)

            res.json({})
        }
    },

    updateUserPassword: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/password",

        async handler(req, res) {
            const json        = req.body
            const parseResult = UPDATE_USER_PASSWORD_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { password } = parseResult.data
            const user         = req.params.user

            await this.userManager.setUserPassword(user, password)

            res.json({})
        }
    },

    updateUserPermissions: {
        permission: "admin",
        method:     "put",
        path:       "/users/:user/is-admin",

        async handler(req, res) {
            const json        = req.body
            const parseResult = UPDATE_USER_PERMISSION_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { isAdmin } = parseResult.data
            const user        = req.params.user

            await this.userManager.setUserPermission(user, isAdmin)

            res.json({})
        }
    },

    addUserNickname: {
        permission: "mixed",
        method:     "post",
        path:       "/users/:user/nicknames/:nickname",

        async handler(req, res) {
            const user = req.params.user
            const max  = this.config.logicMaxNicknames
            const has  = await this.nicknameManager.getUserNicknameCount(user)

            if (has >= max)
                throw new LogicError("Too many nicknames")

            const nickname = req.params.nickname

            await this.nicknameManager.addNickname(user, nickname)

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
        
            await this.userManager.createUser({
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