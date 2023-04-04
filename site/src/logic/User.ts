import z                       from "zod"
import Cookies                 from "js-cookie"
import AuthInfo                from "./AuthInfo"

import { AuthController, get } from "./api"

export type CreationOptions = z.TypeOf<typeof User.JSON_SCHEMA>

export interface FetchAllOptions {
    authController:  AuthController
    fetchNicknames?: boolean
}

export interface FetchOptions {
    login:           string
    authController:  AuthController
    fetchNicknames?: boolean
}

export interface UpdatedOptions {
    updateNicknames?: boolean
    authController:   AuthController
}

export default class User {
    static readonly JSON_SCHEMA = z.object({
        login:     z.string(),
        name:      z.string().nullish(),
        nicknames: z.string().array().nullish(),
        isAdmin:   z.boolean().nullish(),
        isOnline:  z.boolean().nullish(),
        reg:       z.object({
            time:  z.coerce.date().nullish(),
            login: z.string().nullish()
        }).nullish()
    })

    static async fetchAll(options: FetchAllOptions): Promise<User[]> {
        const { authController, fetchNicknames } = options

        const url     = `users?${fetchNicknames ? "nicknames" : ""}`
        const [jsons] = (await get(authController, url)) as [any[], AuthInfo]

        return jsons.map(json => {
            try {
                return User.fromJson(json)
            } catch (error) {
                console.error(error)
                return undefined
            }
        }).filter(user => user != null) as User[]
    }

    static async fetch(options: FetchOptions): Promise<User> {
        const { login, authController, fetchNicknames } = options

        const url    = `users/${encodeURIComponent(login)}?${fetchNicknames ? "nicknames" : ""}`
        const [json] = await get(authController, url)
        
        return User.fromJson(json)
    }

    static fromJson(json: any): User {
        return new User(this.JSON_SCHEMA.parse(json))
    }

    static readonly LOGIN_COOKIE_NAME = "login"

    static checkLogin(login: string) {
        const invalidReason = this.validateLogin(login)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateLogin(login: string): string | undefined {
        const MIN_LENGTH = 4

        if (login.length < MIN_LENGTH)
            return `Login "${login}" is too short. Minimum ${MIN_LENGTH} characters required`

        const MAX_LENGTH = 255

        if (login.length > MAX_LENGTH)
            return `Login is too long. Maximum ${MAX_LENGTH} characters allowed`

        if (login.match(/\s/))
            return `Login "${login}" contains whitespace`

        return undefined
    }

    static checkPassword(password: string) {
        const invalidReason = this.validatePassword(password)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validatePassword(password: string): string | undefined {
        const MIN_LENGTH = 4

        if (password.length < MIN_LENGTH)
            return `Password is too short. Minimum ${MIN_LENGTH} characters required`

        const MAX_LENGTH = 255

        if (password.length > MAX_LENGTH)
            return `Password is too long. Maximum ${MAX_LENGTH} characters allowed`

        return undefined
    }

    static remove() {
        Cookies.remove(this.LOGIN_COOKIE_NAME, { sameSite: "strict" })
    }

    static save(user: User | null | undefined) {
        if (user == null)
            User.remove()
        else
            user.save()
    }

    static load(): User {
        const user = this.safeLoad()

        if (user == null)
            throw new Error("Failed to load user")

        return user
    }

    static safeLoad(): User | undefined {
        const login = Cookies.get(this.LOGIN_COOKIE_NAME)

        if (login == null)
            return undefined

        if (this.validateLogin(login) != null) {
            this.remove()
            return undefined
        }

        return new User({ login })
    }

    static areLoginsEqual(lhs: string | undefined | null, rhs: string | undefined | null): boolean {
        lhs = lhs?.trim().toLowerCase()
        rhs = rhs?.trim().toLowerCase()

        return lhs === rhs
    }

    readonly login:      string
    readonly name?:      string
    readonly nicknames:  string[]
    readonly isAdmin:    boolean
    readonly isOnline:   boolean
    readonly reg:        {
        readonly time:   Date
        readonly login?: string
    }

    constructor(options: CreationOptions) {
        this.login     = options.login
        this.name      = options.name      ?? undefined
        this.nicknames = options.nicknames ?? []
        this.isAdmin   = options.isAdmin   ?? false
        this.isOnline  = options.isOnline  ?? false
        this.reg       =  {
            time:  options.reg?.time       ?? new Date(),
            login: options.reg?.login      ?? undefined
        }
    }

    async updated(options: UpdatedOptions): Promise<User> {
        const { authController, updateNicknames } = options

        return await User.fetch({
            authController,
            login:          this.login,
            fetchNicknames: updateNicknames
        })
    }

    save() {
        Cookies.set(User.LOGIN_COOKIE_NAME, this.login, {
            expires:  3650,
            sameSite: "strict"
        })
    }
}