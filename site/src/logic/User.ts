import z                                          from "zod"
import Cookies                                    from "js-cookie"
import AuthInfo                                   from "./AuthInfo"

import { hasWs                               } from "util/string"
import { AuthController, del, get, post, put } from "./api"

export type CreationOptions = z.TypeOf<typeof User.USER_JSON_SCHEMA>

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

export interface MakeIconOptions {
    login:   string
    name?:   string
    width?:  number
    height?: number
}

export interface RegisterUserOptions {
    authController: AuthController
    login:          string
    password:       string
    name?:          string
    isAdmin?:       boolean
}

export interface SetPasswordOptions {
    authController: AuthController
    login:          string
    password:       string
}

export interface SetNameOptions {
    authController: AuthController
    login:          string
    name:           string | null
}

export interface SetIsAdminOptions {
    authController: AuthController
    login:          string
    isAdmin:        boolean
}

export interface SetNicknamesOptions {
    authController: AuthController
    login:          string
    nicknames?:     string[] | null
}

export interface SetOptions {
    authController: AuthController
    login:          string
    name?:          string   | null
    nicknames?:     string[] | null
    isAdmin?:       boolean
}

export type OnChange = (newUser: User, oldUser: User) => void

export default class User {
    static readonly USER_JSON_SCHEMA = z.object({
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

        const urlOptions = fetchNicknames ? { nicknames: undefined } : undefined
        const url        = this.makeUrl(login, undefined, urlOptions)
        const [json]     = await get(authController, url)
        
        return User.fromJson(json)
    }

    static fromJson(json: any): User {
        return new User(this.USER_JSON_SCHEMA.parse(json))
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

        if (hasWs(login))
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

    static checkUserName(name: string | null) {
        const invalidReason = this.validateName(name)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateName(name: string | null): string | undefined {
        if (name == null)
            return undefined

        const MAX_LENGTH = 255

        if (name.length > MAX_LENGTH)
            return `Name is too long. Maximum ${MAX_LENGTH} characters allowed`

        return undefined
    }

    static checkNickname(nickname: string) {
        const invalidReason = this.validateNickname(nickname)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateNickname(nickname: string): string | undefined {
        const MIN_LENGTH = 4

        if (nickname.length < MIN_LENGTH)
            return `Nickname "${nickname}" is too short. Minimum ${MIN_LENGTH} characters required`

        const MAX_LENGTH = 255

        if (nickname.length > MAX_LENGTH)
            return `Nickname is too long. Maximum ${MAX_LENGTH} characters allowed`

        if (hasWs(nickname))
            return `Nickname "${nickname}" contains whitespace`

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

    static areNicknamesEqual(lhs: string[] | undefined | null, rhs: string[] | undefined | null): boolean {
        if (lhs == null || rhs == null)
            return true

        if (lhs.length !== rhs.length)
            return false

        for (const lhsNickname of lhs)
            if (!rhs.includes(lhsNickname))
                return false

        return true
    }

    static readonly DEFAULT_ICON_WIDTH  = 1024
    static readonly DEFAULT_ICON_HEIGHT = 1024

    static renderDefaultIcon(options: MakeIconOptions): string {
        const FONT_SIZE_SCALE_FACTOR = .8

        const name   = options.name   ?? options.login
        const width  = options.width  ?? this.DEFAULT_ICON_WIDTH
        const height = options.height ?? this.DEFAULT_ICON_HEIGHT
        const canvas = document.createElement("canvas")

        canvas.width  = width
        canvas.height = height

        const context = canvas.getContext("2d")

        if (context == null)
            throw new Error("Canvas is not supported")

        context.fillStyle = "black"

        context.fillRect(0, 0, width, height)

        const text         = makeIconText()
        const initFontSize = width

        context.font         = `${width}px sans-serif`
        context.textBaseline = "middle"
        context.textAlign    = "center"
        context.fillStyle    = "white"

        const metrics  = context.measureText(text)
        const fontSize = FONT_SIZE_SCALE_FACTOR * Math.min(width * initFontSize / metrics.width, height)

        context.font =`${fontSize}px sans-serif`

        const heightDelta = evalHeightDelta()

        context.fillText(text, width / 2, height / 2 + heightDelta)

        const dataUrl = canvas.toDataURL()

        canvas.remove()

        return dataUrl

        function makeIconText(): string {
            const splits = name.split(/\s+/)

            if (splits.length === 1)
                return splits[0][0].toUpperCase()

            return splits[0][0].toUpperCase()
                 + splits[1][0].toUpperCase()
        }

        function evalHeightDelta() {
            const diff = metrics.fontBoundingBoxAscent != null ? metrics.fontBoundingBoxAscent   - metrics.fontBoundingBoxDescent
                                                               : metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent

            return Math.abs(diff / 2)
        }
    }

    static async del(authController: AuthController, login: string) {
        this.validateLogin(login)

        const url = this.makeUrl(login)

        await del(authController, url)
    }

    static makeUrl(login: string, suffix?: string | null, options?: { [key: string]: any }): string {
        const encodedLogin   = encodeURIComponent(login)
        const encodedOptions = Object.entries(options ?? {})
                                     .map(([key, value]) => {
                                        const encodedKey = encodeURIComponent(key)

                                        if (value === undefined)
                                            return encodedKey

                                        const encodedValue = encodeURIComponent(String(value))

                                        return`${encodedKey}=${encodedValue}`
                                     })
                                     .join("&")

        return suffix ? `users/${encodedLogin}/${suffix}?${encodedOptions}`
                      : `users/${encodedLogin}?${encodedOptions}`
    }

    static async register(options: RegisterUserOptions): Promise<User> {
        const { authController, login, password, name, isAdmin } = options

        this.validateLogin(login)
        this.validatePassword(password)

        const url = this.makeUrl(login)
    
        await post(authController, url, { password, name, isAdmin })

        return new User({ login, name, isAdmin })
    }

    static async setPassword(options: SetPasswordOptions) {
        const { authController, login, password } = options

        this.validateLogin(login)
        this.validatePassword(password)

        const url = this.makeUrl(login, "password")
        
        await put(authController, url, { password })
    }

    static async setName(options: SetNameOptions) {
        const { authController, login, name } = options

        this.validateLogin(login)

        const uploadName = name?.trim() ?? null

        if (uploadName?.length === 0)
            return

        const url = this.makeUrl(login, "name")

        await put(authController, url, { name: uploadName })
    }

    static async setIsAdmin(options: SetIsAdminOptions) {
        const { authController, login, isAdmin } = options

        this.validateLogin(login)

        const url = this.makeUrl(login, "is-admin")

        await put(authController, url, { isAdmin })
    }

    static readonly MAX_NICKNAMES_JSON_SCHMEA = z.object({
        max: z.number()
    })

    static async getMaxNicknames(authController: AuthController): Promise<number> {
        const [json] = await get(authController, "max-nicknames")
        const parsed = this.MAX_NICKNAMES_JSON_SCHMEA.parse(json)

        return parsed.max
    }

    static async setNicknames(options: SetNicknamesOptions) {
        const { authController, login } = options
        const nicknames                 = options.nicknames ?? null

        this.validateLogin(login)

        const url = this.makeUrl(login, "nicknames")

        await put(authController, url, { nicknames })
    }

    static async set(options: SetOptions) {
        const {
            authController,
            login,
            name,
            nicknames,
            isAdmin
        } = options

        this.validateLogin(login)

        const url = this.makeUrl(login)

        await put(authController, url, { name, nicknames, isAdmin })
    }

    readonly login:      string
    readonly name?:      string
    readonly nicknames?: string[]
    readonly isAdmin:    boolean
    readonly isOnline:   boolean
    readonly icon:       string
    readonly reg:        {
        readonly time:   Date
        readonly login?: string
    }

    constructor(options: CreationOptions) {
        const { login } = options

        let name = options.name?.trim() ?? undefined

        if (!name?.length)
            name = undefined

        const nicknames = options.nicknames    ?  [...options.nicknames] : undefined
        const isAdmin   = options.isAdmin      ?? false
        const isOnline  = options.isOnline     ?? false
        const regTime   = options.reg?.time    ?? new Date()
        const regLogin  = options.reg?.login   ?? undefined
        const icon      = User.renderDefaultIcon({ login, name })

        this.login     = login
        this.name      = name
        this.nicknames = nicknames
        this.isAdmin   = isAdmin
        this.isOnline  = isOnline
        this.icon      = icon
        this.reg       = {
            time:  regTime,
            login: regLogin
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

    async del(authController: AuthController) {
        await User.del(authController, this.login)
    }

    withName(name: string): User {
        return new User({ ...this, name })
    }

    withIsAdmin(isAdmin: boolean): User {
        return new User({ ...this, isAdmin })
    }

    withNicknames(nicknames: string[]): User {
        return new User({ ...this, nicknames })
    }

    equalTo(user: User): boolean {
        if (!User.areLoginsEqual(this.login, user.login)
         || !User.areNicknamesEqual(this.nicknames, user.nicknames)
         || this.name             !== user.name
         || this.isAdmin          !== user.isAdmin
         || this.icon             !== user.icon)
            return false

        return true
    }

    async saveDiff(authController: AuthController, user: User) {
        const name      = this.name    === user.name                             ? undefined : this.name ?? null
        const isAdmin   = this.isAdmin === user.isAdmin                          ? undefined : this.isAdmin
        const nicknames = User.areNicknamesEqual(this.nicknames, user.nicknames) ? undefined : this.nicknames

        await User.set({
            authController,
            name,
            isAdmin,
            nicknames, 
            login: this.login
        })
    }
}