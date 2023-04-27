import z                                       from "zod"
import Cookies                                 from "js-cookie"
import AuthInfo                                from "./AuthInfo"

import { hasWs                               } from "util/string"
import { AuthController, del, get, post, put } from "./api"

export interface CreationOptions extends z.TypeOf<typeof User.USER_JSON_SCHEMA> {
    acceptInvalid?: boolean
}

export interface GetAllOptions {
    authController:  AuthController
    fetchNicknames?: boolean
    fetchIcon?:      boolean
    acceptInvalid?:  boolean
}

export interface GetOptions {
    login:           string
    authController:  AuthController
    fetchNicknames?: boolean
    fetchIcon?:      boolean
    acceptInvalid?:  boolean
}

export interface UpdatedOptions {
    updateNicknames?: boolean
    updateIcon?:      boolean
    authController:   AuthController
}

export interface MakeIconOptions {
    login:   string
    name?:   string | null
    width?:  number
    height?: number
}

export interface RegisterUserOptions {
    authController: AuthController
    login:          string
    password:       string
    name?:          string | null
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

export interface SetIconOptions {
    authController: AuthController
    login:          string
    icon:           string | null
}

export interface SetIsAdminOptions {
    authController: AuthController
    login:          string
    isAdmin:        boolean
}

export interface SetNicknamesOptions {
    authController: AuthController
    login:          string
    nicknames?:     string[]
}

export interface SetOptions {
    authController: AuthController
    login:          string
    name?:          string | null
    icon?:          string | null
    nicknames?:     string[]
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
        icon:      z.string().nullish(),
        reg:       z.object({
            time:  z.coerce.date().nullish(),
            login: z.string().nullish()
        }).nullish()
    })

    static async getAll(options: GetAllOptions): Promise<User[]> {
        const {
            authController,
            fetchNicknames,
            fetchIcon,
            acceptInvalid
        } = options

        const urlOptions = [] as string[]

        if (fetchNicknames)
            urlOptions.push("nicknames")

        if (fetchIcon)
            urlOptions.push("icon")

        const url = `users?${urlOptions.join("&")}`

        const [jsons] = (await get(authController, url)) as [any[], AuthInfo]

        return jsons.map(json => {
            try {
                return User.fromJson(json, acceptInvalid)
            } catch (error) {
                console.error(error)
                return undefined
            }
        }).filter(user => user != null) as User[]
    }

    static async get(options: GetOptions): Promise<User> {
        const {
            authController,
            fetchNicknames,
            fetchIcon,
            login,
            acceptInvalid
        } = options

        const url = this.makeUrl(login, undefined, {
            nicknames: fetchNicknames,
            icon:      fetchIcon
        })

        const [json] = await get(authController, url)
        
        return User.fromJson(json, acceptInvalid)
    }

    static fromJson(json: any, acceptInvalid?: boolean): User {
        return new User({ ...this.USER_JSON_SCHEMA.parse(json), acceptInvalid})
    }

    static readonly LOGIN_COOKIE_NAME = "login"

    static checkLogin(login: string) {
        return this.checkNormedLogin(this.normLogin(login))
    }

    static checkNormedLogin(login: string) {
        const invalidReason = this.validateNormedLogin(login)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateLogin(login: string): string | undefined {
        return this.validateNormedLogin(this.normLogin(login))
    }

    static validateNormedLogin(login: string): string | undefined {
        const MIN_LENGTH = 4

        if (login.length < MIN_LENGTH) {
            const reason = login.length === 0 ? "Login is empty"
                                              : `Login "${login}" is too short`

            return `${reason}. Minimum ${MIN_LENGTH} characters required`
        }

        const MAX_LENGTH = 255

        if (login.length > MAX_LENGTH)
            return `Login is too long. Maximum ${MAX_LENGTH} characters allowed`

        if (hasWs(login))
            return `Login "${login}" contains whitespace`

        return undefined
    }

    static normLogin(login: string): string {
        return login.trim()
    }

    static checkPassword(password: string) {
        const invalidReason = this.validatePassword(password)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validatePassword(password: string): string | undefined {
        const MIN_LENGTH = 4

        if (password.length < MIN_LENGTH) {
            const reason = password.length === 0 ? "Password is empty"
                                                 : "Password is too short"

            return `${reason}. Minimum ${MIN_LENGTH} characters required`
        }

        const MAX_LENGTH = 255

        if (password.length > MAX_LENGTH)
            return `Password is too long. Maximum ${MAX_LENGTH} characters allowed`

        return undefined
    }

    static checkName(name: string | undefined | null) {
        return this.checkNormedName(this.normName(name))
    }

    static checkNormedName(name: string | undefined) {
        const invalidReason = this.validateNormedName(name)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateName(name: undefined | null):          undefined
    static validateName(name: string | undefined | null): string | undefined
    static validateName(name: string | undefined | null): string | undefined {
        return this.validateNormedName(this.normName(name))
    }

    static validateNormedName(name: undefined):          undefined
    static validateNormedName(name: string | undefined): string | undefined
    static validateNormedName(name: string | undefined): string | undefined {
        if (name == null)
            return undefined

        const MAX_LENGTH = 255

        if (name.length > MAX_LENGTH)
            return `Name is too long. Maximum ${MAX_LENGTH} characters allowed`

        return undefined
    }

    static normName(name: undefined | null):          undefined
    static normName(name: string | undefined | null): string | undefined
    static normName(name: string | undefined | null): string | undefined {
        if (name == null)
            return undefined

        name = name.trim()

        if (name.length === 0)
            return undefined

        return name
    }

    static checkNicknames(nicknames: string[] | undefined | null) {
        if (nicknames)
            for (const nickname of nicknames)
                this.checkNickname(nickname)
    }

    static checkNormedNicknames(nicknames: string[] | undefined) {
        if (nicknames)
            for (const nickname of nicknames)
                this.checkNormedNickname(nickname)
    }

    static validateNicknames(nicknames: string[] | undefined | null): (string | undefined)[] {
        return nicknames != null ? nicknames.map(this.validateNormedNickname)
                                 : []
    }

    static validateNormedNicknames(nicknames: string[] | undefined): (string | undefined)[] {
        return nicknames != null ? nicknames.map(this.validateNormedNickname)
                                 : []
    }

    static normNicknames(nicknames: string[]):                    string[]
    static normNicknames(nicknames: undefined | null):            undefined
    static normNicknames(nicknames: string[] | undefined | null): string[] | undefined
    static normNicknames(nicknames: string[] | undefined | null): string[] | undefined {
        return nicknames != null ? nicknames.map(this.normNickname)
                                 : undefined
    }

    static checkNickname(nickname: string) {
        return this.checkNormedNickname(this.normNickname(nickname))
    }

    static checkNormedNickname(nickname: string) {
        const invalidReason = this.validateNormedNickname(nickname)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateNickname(nickname: string): string | undefined {
        return this.validateNormedNickname(this.normNickname(nickname))
    }

    static validateNormedNickname(nickname: string): string | undefined {
        const MIN_LENGTH = 4

        if (nickname.length < MIN_LENGTH) {
            const reason = nickname.length === 0 ? "Nickname is empty"
                                                 : `Nickname "${nickname}" is too short`

            return `${reason}. Minimum ${MIN_LENGTH} characters required`
        }

        const MAX_LENGTH = 255

        if (nickname.length > MAX_LENGTH)
            return `Nickname is too long. Maximum ${MAX_LENGTH} characters allowed`

        if (hasWs(nickname))
            return `Nickname "${nickname}" contains whitespace`

        return undefined
    }

    static normNickname(nickname: string): string {
        return nickname.trim()
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

    static readonly MAX_ICON_WIDTH  = 1024
    static readonly MAX_ICON_HEIGHT = 1024

    static renderDefaultIcon(options: MakeIconOptions): string {
        const FONT_SIZE_SCALE_FACTOR = .8

        const name   = (options.name   ?? options.login).trim()
        const width  =  options.width  ?? this.MAX_ICON_WIDTH
        const height =  options.height ?? this.MAX_ICON_HEIGHT
        const canvas =  document.createElement("canvas")

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
        const url = this.makeUrl(login)
        await del(authController, url)
    }

    static makeUrl(login: string, suffix?: string | null, options: { [key: string]: any } = {}): string {
        login = this.normLogin(login)

        this.checkNormedLogin(login)

        const encodedLogin   = encodeURIComponent(login)
        const encodedOptions = Object.entries(options)
                                     .map(([key, value]) => {
                                        if (!value)
                                            return null

                                        const encodedKey = encodeURIComponent(key)

                                        if (typeof value === "boolean")
                                            return encodedKey

                                        const encodedValue = encodeURIComponent(String(value))

                                        return`${encodedKey}=${encodedValue}`
                                     })
                                     .filter(arg => arg != null)
                                     .join("&")

        return suffix ? `users/${encodedLogin}/${suffix}?${encodedOptions}`
                      : `users/${encodedLogin}?${encodedOptions}`
    }

    static async register(options: RegisterUserOptions): Promise<User> {
        const {
            authController,
            login,
            password,
            isAdmin
        } = options

        const url = this.makeUrl(login)

        this.checkPassword(password)

        const name = this.normName(options.name)

        this.checkNormedName(name)
    
        await post(authController, url, {
            name,
            password,
            isAdmin
        })

        return new User({ login, name, isAdmin })
    }

    static async setPassword(options: SetPasswordOptions) {
        const {
            authController,
            login,
            password
        } = options

        const url = this.makeUrl(login, "password")

        this.checkPassword(password)
        
        await put(authController, url, { password })
    }

    static async setName(options: SetNameOptions) {
        const {
            authController,
            login
        } = options

        const url  = this.makeUrl(login, "name")
        const name = this.normName(options.name)

        this.checkNormedName(name)

        await put(authController, url, {
            name: name ?? null
        })
    }

    static async setIcon(options: SetIconOptions) {
        const {
            authController,
            login,
            icon
        } = options

        const url = this.makeUrl(login, "icon")

        await put(authController, url, {
            icon: icon ?? null
        })
    }

    static async setIsAdmin(options: SetIsAdminOptions) {
        const {
            authController,
            login,
            isAdmin
        } = options

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

        const url = this.makeUrl(login, "nicknames")

        const nicknames = this.normNicknames(options.nicknames) ?? []

        this.checkNormedNicknames(nicknames)

        await put(authController, url, nicknames)
    }

    static async set(options: SetOptions) {
        const {
            authController,
            login,
            icon,
            isAdmin,
        } = options

        const url = this.makeUrl(login)

        const name = options.name !== undefined ? this.normName(options.name) ?? null
                                                : undefined

        if (name != null)
            this.checkNormedName(name)

        const nicknames = this.normNicknames(options.nicknames) ?? undefined

        if (nicknames != null)
            this.checkNormedNicknames(nicknames)

        await put(authController, url, {
            isAdmin,
            name,
            icon,
            nicknames,
        })
    }
    
    static sort(users: User[]): User[] {
        return users.sort((lhs, rhs) => {
            if (lhs.isAdmin && !rhs.isAdmin)
                return -1

            if (!lhs.isAdmin && rhs.isAdmin)
                return 1

            return (lhs.name ?? lhs.login) >= (rhs.name ?? rhs.login) ? 1 : -1
        })
    }

    readonly login:       string
    readonly name?:       string
    readonly nicknames?:  string[]
    readonly isAdmin:     boolean
    readonly isOnline:    boolean
    readonly icon?:       string
    readonly displayIcon: string
    readonly reg:         {
        readonly time:    Date
        readonly login?:  string
    }

    constructor(options: CreationOptions) {
        const validate  = !options.acceptInvalid

        const login     = User.normLogin(options.login)
        const name      = User.normName(options.name)
        const nicknames = User.normNicknames(options.nicknames)

        if (validate) {
            User.checkNormedLogin(login)
            User.checkNormedName(name)
            User.checkNormedNicknames(nicknames)
        }

        const isAdmin     = options.isAdmin    ?? false
        const isOnline    = options.isOnline   ?? false
        const regTime     = options.reg?.time  ?? new Date()
        const regLogin    = options.reg?.login ?? undefined
        const icon        = options.icon       ?? undefined
        const displayIcon = icon               ?? User.renderDefaultIcon({ login, name })

        this.login       = login
        this.name        = name
        this.nicknames   = nicknames
        this.isAdmin     = isAdmin
        this.isOnline    = isOnline
        this.icon        = icon
        this.displayIcon = displayIcon
        this.reg         = {
            time:  regTime,
            login: regLogin
        }
    }

    async updated(options: UpdatedOptions): Promise<User> {
        const {
            authController,
            updateNicknames,
            updateIcon,
        } = options

        return await User.get({
            authController,
            login:          this.login,
            fetchIcon:      updateIcon,
            fetchNicknames: updateNicknames,
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
        User.checkName(name)

        return new User({
            ...this,
            name,
            acceptInvalid: true
        })
    }

    withIsAdmin(isAdmin: boolean): User {
        return new User({
            ...this,
            isAdmin,
            acceptInvalid: true
        })
    }

    withNicknames(nicknames: string[]): User {
        User.checkNicknames(nicknames)

        return new User({
            ...this,
            nicknames,
            acceptInvalid: true
        })
    }

    withIcon(icon?: string): User {
        return new User({
            ...this,
            icon,
            acceptInvalid: true
        })
    }

    equalTo(user: User): boolean {
        return User.areLoginsEqual(this.login, user.login)
            && User.areNicknamesEqual(this.nicknames, user.nicknames)
            && this.name    === user.name
            && this.isAdmin === user.isAdmin
            && this.icon    === user.icon
    }

    async saveDiff(authController: AuthController, user: User) {
        const name      = this.name    === user.name                             ? undefined : this.name ?? null
        const icon      = this.icon    === user.icon                             ? undefined : this.icon ?? null
        const isAdmin   = this.isAdmin === user.isAdmin                          ? undefined : this.isAdmin
        const nicknames = User.areNicknamesEqual(this.nicknames, user.nicknames) ? undefined : this.nicknames

        await User.set({
            authController,
            name,
            icon,
            isAdmin,
            nicknames,
            login: this.login
        })
    }
}