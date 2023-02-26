import isBase64 from "is-base64"
import Server   from "./Server"

import { Request, Response } from "express"
import { isHex             } from "./util/string"

import * as l from "./logic"

export type UnitCollection = {
    [key: string]: Unit
}

export interface Unit {
    method:  Method
    path:    string
    handler: Hander
}

export type Method = "get" | "post" | "put" | "delete"
export type Hander = (this: Server, req: Request, res: Response) => Promise<void>

export function requireAcceptJson(req: Request, res: Response, next: () => void) {
    if (req.accepts("json")) {
        next()
        return
    }

    res.sendStatus(406)
}

export const units: UnitCollection = {
    auth: {
        method: "post",
        path:   "/auth",

        async handler(req, res) {
            const authorization = req.headers.authorization
            
            if (authorization == null) {
                res.sendStatus(400)
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
            const tokenPair = await l.auth(this.mysqlConnection, login, password)

            res.json(l.tokenPairToJson(tokenPair))
        }
    },

    reauth: {
        method: "post",
        path:   "/reauth",

        async handler(req, res) {
            const authorization = req.headers.authorization

            if (authorization == null || !isHex(authorization)) {
                res.sendStatus(400)
                return
            }

            const rToken = Buffer.from(authorization, "hex")

            if (rToken.length != 64) {
                res.sendStatus(400)
                return
            }

            const tokenPair = await l.reauth(this.mysqlConnection, rToken)

            res.json(l.tokenPairToJson(tokenPair))
        }
    },

    deauth: {
        method: "post",
        path:   "/deauth",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getAllUsers: {
        method: "get",
        path:   "/users",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUser: {
        method: "get",
        path:   "/users/:user",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserReg: {
        method: "get",
        path:   "/users/:user/reg",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserRegTime: {
        method: "get",
        path:   "/users/:user/reg/time",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserRegUser: {
        method: "get",
        path:   "/users/:user/reg/user",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserName: {
        method: "get",
        path:   "/users/:user/name",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserNicknames: {
        method: "get",
        path:   "/users/:user/nicknames",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteAllUsers: {
        method: "delete",
        path:   "/users",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteUser: {
        method: "delete",
        path:   "/users/:user",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteAllUserNicknames: {
        method: "delete",
        path:   "/users/:user/nicknames",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteUserNickname: {
        method: "delete",
        path:   "/users/:user/nicknames/:nickname",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    updateUserName: {
        method: "put",
        path:   "/users/:user/name",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    updateUserPassword: {
        method: "put",
        path:   "/users/:user/password",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    addUserNickname: {
        method: "post",
        path:   "/users/:user/nicknames/:nickname",

        async handler(req, res) {
            res.sendStatus(501)
        }
    },

    addUser: {
        method: "post",
        path:   "/users/:user",

        async handler(req, res) {
            res.sendStatus(501)
        }
    }
}