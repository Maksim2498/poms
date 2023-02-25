import Server from "./Server"

import { Request, Response } from "express"

export type UnitCollection = {
    [key: string]: Unit
}

export interface Unit {
    method:  Method
    path:    string
    handler: Hander
}

export type Method = "get" | "post" | "put" | "delete"
export type Hander = (this: Server, req: Request, res: Response) => void

export function requireAcceptJson(req: Request, res: Response, next: () => void) {
    if (req.accepts("json"))
        next()

    res.sendStatus(406)
}

export const units: UnitCollection = {
    auth: {
        method: "post",
        path:   "/auth",

        handler(req, res) {
            const authorization = req.headers.authorization
            
            if (authorization == null) {
                res.sendStatus(400)
                return
            }

            res.sendStatus(501)
        }
    },

    deauth: {
        method: "post",
        path:   "/deauth",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    getAllUsers: {
        method: "get",
        path:   "/users",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUser: {
        method: "get",
        path:   "/users/:user",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserReg: {
        method: "get",
        path:   "/users/:user/reg",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserRegTime: {
        method: "get",
        path:   "/users/:user/reg/time",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserRegUser: {
        method: "get",
        path:   "/users/:user/reg/user",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserName: {
        method: "get",
        path:   "/users/:user/name",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    getUserNicknames: {
        method: "get",
        path:   "/users/:user/nicknames",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteAllUsers: {
        method: "delete",
        path:   "/users",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteUser: {
        method: "delete",
        path:   "/users/:user",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteAllUserNicknames: {
        method: "delete",
        path:   "/users/:user/nicknames",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    deleteUserNickname: {
        method: "delete",
        path:   "/users/:user/nicknames/:nickname",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    updateUserName: {
        method: "put",
        path:   "/users/:user/name",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    updateUserPassword: {
        method: "put",
        path:   "/users/:user/password",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    addUserNickname: {
        method: "post",
        path:   "/users/:user/nicknames/:nickname",

        handler(req, res) {
            res.sendStatus(501)
        }
    },

    addUser: {
        method: "post",
        path:   "/users/:user",

        handler(req, res) {
            res.sendStatus(501)
        }
    }
}