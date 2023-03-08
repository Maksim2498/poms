import z from "zod"

import { readLoginFromCookies } from "./auth"
import { checkLogin           } from "./auth"

import * as api from "./api"

const userInfoSchema = z.object({
    name:      z.string().nullable(),
    nicknames: z.string().array().nullable(),
    isAdmin:   z.boolean(),
    isOnline:  z.boolean(),
    reg:       z.object({
        time:  z.coerce.date(),
        login: z.string().nullable()
    })
})

export interface UserInfo {
    login:     string
    name:      string | null
    nicknames: string[]
    isAdmin:   boolean
    isOnline:  boolean
    reg:       {
        time:  Date
        login: string | null
    }
}

export interface UserOptions {
    login:      string
    name?:      string   | null
    nicknames?: string[] | null
    isAdmin?:   boolean  | null
    isOnline?:  boolean  | null
    reg?:       {
        time?:  Date     | null
        login?: string   | null
    }                    | null
}

export default class User implements UserInfo {
    static async loadUser(): Promise<User> {
        const login = readLoginFromCookies()
        
        if (login == null)
            throw new Error("There is no locally saved user login")

        const info = await this.getInfo(login)

        return new User(info)
    }

    static async getInfo(login: string): Promise<UserInfo> {
        checkLogin(login)

        const uri  = `users/${encodeURIComponent(login)}?nicknames`
        const json = await api.get(uri)
        const raw  = userInfoSchema.parse(json)

        return {
            ...raw,
            login,
            nicknames: raw.nicknames ?? []
        }
    }

    login:     string
    name:      string | null
    nicknames: string[]
    isAdmin:   boolean
    isOnline:  boolean
    reg:       {
        time:  Date
        login: string | null
    }

    constructor(options: UserOptions) {
        this.login     = options.login
        this.name      = options.name      ?? null
        this.nicknames = options.nicknames != null ? [...options.nicknames] : []
        this.isAdmin   = options.isAdmin   ?? false
        this.isOnline  = options.isOnline  ?? false
        this.reg       = {
            time:  options.reg?.time  ?  new Date(options.reg?.time) : new Date(),
            login: options.reg?.login ?? null
        }
    }
}