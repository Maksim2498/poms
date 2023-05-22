import z                                                   from "zod"
import isBase64                                            from "is-base64"
import bufferToDataUrl                                     from "buffer-to-data-url"
import Server                                              from "./Server"

import { Request, Response                               } from "express"
import { Connection                                      } from "mysql2/promise"
import { parseTokenId, safeParseTokenId, tokenPairToJson } from "./logic/token"

export type EndPointCollection = {
    [key: string]: EndPoint
}

export interface EndPoint {
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
    if (this.config.read.logic.allowAnonymousAccess && permission === "user")
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

        // Server has full access
        if (aTokenInfo?.userId != null)
            switch (permission) {
                case "user":
                    await tokenManager.checkATokenIsActive(connection, aTokenInfo)
                    break

                // Check if not an admin trying to modify other's data

                case "mixed": {
                    await tokenManager.checkATokenIsActive(connection, aTokenInfo)

                    const userManager     = this.userManager
                    const reqUserId       = aTokenInfo!.userId
                    const reqUserInfo     = (await userManager.getUserInfo(connection, reqUserId))!
                    const reqUserLogin    = reqUserInfo.login.toLowerCase()
                    const targetUserLogin = req.params.user.toLowerCase()
                    const isReqUserAdmin  = reqUserInfo.isAdmin

                    if (reqUserLogin !== targetUserLogin && !isReqUserAdmin)
                        res.sendStatus(403)

                    break
                }

                case "admin": {
                    await tokenManager.checkATokenIsActive(connection, aTokenInfo)

                    const userManager = this.userManager
                    const userId      = aTokenInfo!.userId
                    const userInfo    = (await userManager.getUserInfo(connection, userId))!

                    if (!userInfo.isAdmin)
                        res.sendStatus(403)
                }
            }

        await connection.commit()
    } finally {
        connection.release()
    }
}

const ICON_SCHEMA = z.string()
                     .regex(/^\s*data\s*:\s*image\s*\/\s*png\s*;\s*base64\s*,\s*[a-z0-9+/=]*$/i)
                     .transform(url => {
                         const commaPos = url.indexOf(",")
                         const data     = url.slice(commaPos + 1)
                         const icon     = Buffer.from(data, "base64")

                         return icon
                     })

const ADD_USER_SCHEMA = z.object({
    password:  z.string(),
    name:      z.ostring(),
    icon:      ICON_SCHEMA.nullish(),
    isAdmin:   z.oboolean(),
    nicknames: z.string().array().nullish(),
})

const UPDATE_USER_SCHEMA = z.object({
    name:      z.string().nullish(),
    icon:      ICON_SCHEMA.nullish(),
    nicknames: z.string().array().nullish(),
    isAdmin:   z.oboolean(),
})

const UPDATE_USER_NAME_SCHEMA = z.object({
    name: z.string().nullable(),
})

const UPDATE_USER_ICON_SCHEMA = z.object({
    icon: ICON_SCHEMA.nullable()
})

const UPDATE_USER_PASSWORD_SCHEMA = z.object({
    password: z.string(),
})

const UPDATE_USER_PERMISSION_SCHEMA = z.object({
    isAdmin: z.boolean(),
})

const UPDATE_NICKNAMES_SCHEMA = z.string().array()

export const endPoints: EndPointCollection = {
    isAnonymousAccessAllowed: {
        method: "get",
        path:   "/anonym-access-allowed",

        async handler(this: Server, req: Request, res: Response) {
            const allowed = this.config.read.logic.allowAnonymousAccess
            res.json({ allowed })
        }
    },

    getMaxNicknames: {
        permission: "user",
        method:     "get",
        path:       "/max-nicknames",

        async handler(this: Server, req: Request, res: Response) {
            const max = this.config.read.logic.maxNicknames
            res.json({ max })
        }
    },

    isConsoleAvailable: {
        permission: "admin",
        method:     "get",
        path:       "/console-available",

        async handler(this: Server, req: Request, res: Response) {
            const available = this.config.isRconAvailable
            res.json({ available })
        }
    },

    getMaxTokens: {
        permission: "user",
        method:     "get",
        path:       "/max-tokens",

        async handler(this: Server, req: Request, res: Response) {
            const max = this.config.read.logic.maxTokens
            res.json({ max })
        }
    },

    auth: {
        method: "post",
        path:   "/auth",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            if (this.config.useAuthDelay)
                await this.authThrottler.throttle(req.ip)

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
            const fetchIcon      = "icon"     in req.query
            const fetchNicknames = "nickname" in req.query
            const info           = await this.userManager.getAllUsersDeepInfo(connection, { fetchIcon })
            const jsonPromises   = info.map(async i => {
                const {
                    id,
                    login,
                    isAdmin,
                    isOnline,
                } = i

                const name = i.name ?? null

                const icon = fetchIcon ? i.icon != null ? await bufferToDataUrl("image/png", i.icon)
                                                        : null
                                       : undefined
                
                const nicknames = fetchNicknames ? await this.nicknameManager.getUserNicknames(connection, id)
                                                 : undefined

                const created = i.created.toISOString()
                const creator = i.creatorInfo?.login ?? null

                return  {
                    login,
                    name,
                    icon,
                    isAdmin,
                    isOnline,
                    nicknames,
                    reg: {
                        time:  created,
                        login: creator
                    }
                }
            })

            const json = await Promise.all(jsonPromises)

            res.json(json)
        }
    },

    getUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user           = req.params.user
            const fetchIcon      = "icon"      in req.query
            const fetchNicknames = "nicknames" in req.query

            const info = await this.userManager.forceGetDeepUserInfo(connection, user, { fetchIcon })

            const {
                id,
                login,
                isAdmin,
                isOnline
            } = info

            const name = info.name ?? null

            const icon = fetchIcon ? info.icon != null ? await bufferToDataUrl("image/png", info.icon)
                                                       : null
                                   : undefined

            const nicknames = fetchNicknames ? await this.nicknameManager.getUserNicknames(connection, id)
                                             : undefined

            const created = info.created.toISOString()
            const creator = info.creatorInfo?.login ?? null

            const json = {
                login,
                name,
                icon,
                isAdmin,
                isOnline,
                nicknames,
                reg: {
                    time:  created,
                    login: creator
                }
            }

            res.json(json)
        }
    },

    getUserLogin: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/login",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user      = req.params.user
            const { login } = await this.userManager.forceGetDeepUserInfo(connection, user)

            res.json({ login })
        }
    },

    isUserAdmin: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-admin",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user        = req.params.user
            const { isAdmin } = await this.userManager.forceGetUserInfo(connection, user)
            
            res.json({ isAdmin })
        }
    },

    isUserOnline: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/is-online",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user         = req.params.user
            const { isOnline } = await this.userManager.forceGetUserInfo(connection, user)
            
            res.json({ isOnline })
        }
    },

    getUserReg: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.forceGetDeepUserInfo(connection, user)

            res.json({
                time:  info.created.toISOString(),
                login: info.creatorInfo?.login ?? null
            })
        }
    },

    getUserRegTime: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg/time",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.forceGetUserInfo(connection, user)

            res.json({ time: info.created.toISOString() })
        }
    },

    getUserRegUser: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/reg/user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.forceGetDeepUserInfo(connection, user)

            res.json({ login: info.creatorInfo?.login ?? null })
        }
    },

    getUserName: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/name",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user = req.params.user
            const info = await this.userManager.forceGetUserInfo(connection, user)

            res.json({ name: info.name ?? null })
        }
    },

    getUserIcon: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/icon",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user     = req.params.user
            const { icon } = await this.userManager.forceGetUserInfo(connection, user, { fetchIcon: true })

            res.json({
                icon: icon != null ? await bufferToDataUrl("image/png", icon)
                                   : null
            })
        }
    },

    getUserNicknames: {
        permission: "user",
        method:     "get",
        path:       "/users/:user/nicknames",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user      = req.params.user
            const nicknames = await this.nicknameManager.forceGetUserNicknames(connection, user)

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
            const status   = await this.statusFetcher.fetch(connection)
            const { name } = status.version

            res.json({ name })
        }
    },

    getServerVersionProtocol: {
        permission: "user",
        method:     "get",
        path:       "/server/version/protocol",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status       = await this.statusFetcher.fetch(connection)
            const { protocol } = status.version

            res.json({ protocol })
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
            const { players     } = await this.statusFetcher.fetch(connection)
            const { online, max } = players

            res.json({ online, max })
        }
    },

    getServerOnlinePlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players/online",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status     = await this.statusFetcher.fetch(connection)
            const { online } = status.players

            res.json({ online })
        }
    },

    getServerMaxPlayers: {
        permission: "user",
        method:     "get",
        path:       "/server/players/max",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status  = await this.statusFetcher.fetch(connection)
            const { max } = status.players

            res.json({ max })
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
            const status  = await this.statusFetcher.fetch(connection)
            const { raw } = status.motd

            res.json({ raw })
        }
    },

    getServerCleanMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/clean",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status    = await this.statusFetcher.fetch(connection)
            const { clean } = status.motd

            res.json({ clean })
        }
    },

    getServerHtmlMotd: {
        permission: "user",
        method:     "get",
        path:       "/server/motd/html",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status   = await this.statusFetcher.fetch(connection)
            const { html } = status.motd

            res.json({ html })
        }
    },

    getServerAddress: {
        permission: "user",
        method:     "get",
        path:       "/server/address",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status      = await this.statusFetcher.fetch(connection)
            const { address } = status

            res.json({ address })
        }
    },

    getServerFavicon: {
        permission: "user",
        method:     "get",
        path:       "/server/favicon",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const status      = await this.statusFetcher.fetch(connection)
            const { favicon } = status

            res.json({ favicon })
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

            await this.userManager.forceDeleteUser(connection, user)

            res.json({})
        }
    },

    deleteAllUserNicknames: {
        permission: "mixed",
        method:     "delete",
        path:       "/users/:user/nicknames",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const user  = req.params.user
            const count = await this.nicknameManager.forceDeleteAllUserNicknames(connection, user)

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

            await this.nicknameManager.forceDeleteUserNickname(connection, user, nickname)

            res.json({})
        }
    },

    updateUser: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json         = req.body
            const parsedResult = UPDATE_USER_SCHEMA.safeParse(json)

            if (!parsedResult.success) {
                res.sendStatus(400)
                return
            }

            const {
                name,
                icon,
                nicknames,
                isAdmin
            } = parsedResult.data

            const user = req.params.user

            if (name !== undefined)
                await this.userManager.forceSetUserName(connection, user, name)

            if (nicknames != null)
                await this.nicknameManager.forceSetUserNicknames(connection, user, nicknames)

            const authorization = req.headers.authorization

            if (isAdmin !== undefined && authorization !== undefined) {
                const aTokenId   = parseTokenId(authorization)
                const aTokenInfo = await this.tokenManager.forceGetATokenInfo(connection, aTokenId)

                if (aTokenInfo.userId == null)
                    await this.userManager.forceSetUserPermission(connection, user, isAdmin)
                else {
                    const userInfo = await this.userManager.getUserInfo(connection, aTokenInfo.userId)

                    if (userInfo?.isAdmin)
                        await this.userManager.forceSetUserPermission(connection, user, isAdmin)
                }
            }

            if (icon !== undefined)
                await this.userManager.forceSetUserIcon(connection, user, icon)

            res.json({})
        }
    },

    updateUserIcon: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/icon",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json        = req.body
            const parseResult = UPDATE_USER_ICON_SCHEMA.safeParse(json)

            if (!parseResult.success) {
                res.sendStatus(400)
                return
            }

            const { icon } = parseResult.data
            const user     = req.params.user

            await this.userManager.forceSetUserIcon(connection, user, icon)

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

            await this.userManager.forceSetUserName(connection, user, name)

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

            await this.userManager.forceSetUserPassword(connection, user, password)
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

            await this.userManager.forceSetUserPermission(connection, user, isAdmin)

            res.json({})
        }
    },

    updateUserNicknames: {
        permission: "mixed",
        method:     "put",
        path:       "/users/:user/nicknames",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json   = req.body
            const parsed = UPDATE_NICKNAMES_SCHEMA.safeParse(json)

            if (!parsed.success) {
                res.sendStatus(400)
                return
            }

            const nicknames = parsed.data
            const user      = req.params.user

            await this.nicknameManager.forceSetUserNicknames(connection, user, nicknames)

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

            await this.nicknameManager.forceAddUserNickname(connection, user, nickname)

            res.json({})
        }
    },

    addUser: {
        permission: "admin",
        method:     "post",
        path:       "/users/:user",

        async handler(this: Server, connection: Connection, req: Request, res: Response) {
            const json   = req.body
            const parsed = ADD_USER_SCHEMA.safeParse(json)

            if (!parsed.success) {
                res.sendStatus(400)
                return
            }

            const {
                password,
                name,
                icon,
                isAdmin,
                nicknames,
            } = parsed.data

            const authorization = req.headers.authorization!
            const aTokenId      = parseTokenId(authorization)
            const aTokenInfo    = await this.tokenManager.forceGetATokenInfo(connection, aTokenId)
            const creatorId     = aTokenInfo.userId
            const login         = req.params.user
        
            await this.userManager.forceCreateUser(connection, {
                login,
                password,
                name,
                icon,
                isAdmin,
                creator: creatorId
            })

            if (nicknames != null && nicknames.length > 0)
                await this.nicknameManager.forceSetUserNicknames(connection, login, nicknames)
        
            res.json({})
        }
    }
}