import Server from "./Server"

import { Request, Response } from "express"

export interface Unit {
    method:  Method
    path:    string
    handler: Hander
}

export type Method = "get" | "post" | "put" | "delete"
export type Hander = (this: Server, req: Request, res: Response) => void

export const auth: Unit = {
    method: "post",
    path:   "/auth",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const deauth: Unit = {
    method: "post",
    path:   "/deauth",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const getAllUsers: Unit = {
    method: "get",
    path:   "/users",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const getUser: Unit = {
    method: "get",
    path:   "/users/:user",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const getUserReg: Unit = {
    method: "get",
    path:   "/users/:user/reg",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const getUserRegTime: Unit = {
    method: "get",
    path:   "/users/:user/reg/time",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const getUserRegUser: Unit = {
    method: "get",
    path:   "/users/:user/reg/user",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const getUserName: Unit = {
    method: "get",
    path:   "/users/:user/name",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const getUserNicknames: Unit = {
    method: "get",
    path:   "/users/:user/nicknames",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const deleteAllUsers: Unit = {
    method: "delete",
    path:   "/users",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const deleteUser: Unit = {
    method: "delete",
    path:   "/users/:user",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const deleteAllUserNicknames: Unit = {
    method: "delete",
    path:   "/users/:user/nicknames",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const deleteUserNickname: Unit = {
    method: "delete",
    path:   "/users/:user/nicknames/:nickname",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const updateUserName: Unit = {
    method: "put",
    path:   "/users/:user/name",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const updateUserPassword: Unit = {
    method: "put",
    path:   "/users/:user/password",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const addUserNickname: Unit = {
    method: "post",
    path:   "/users/:user/nicknames/:nickname",

    handler(req, res) {
        res.sendStatus(501)
    }
}

export const addUser: Unit = {
    method: "post",
    path:   "/users/:user",

    handler(req, res) {
        res.sendStatus(501)
    }
}