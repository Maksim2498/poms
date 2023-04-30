import z                                       from "zod"
import Cookies                                 from "js-cookie"

import { hasWs                               } from "util/string"
import { AuthController, del, get, post, put } from "./api"

export interface CreationOptions extends z.TypeOf<typeof User.USER_JSON_SCHEMA> {
    acceptInvalid?:    boolean
    deferIconLoading?: boolean
    authController?:   AuthController
}

export interface FromJsonOptions {
    acceptInvalid?:    boolean
    deferIconLoading?: boolean
    authController?:   AuthController
}

export interface FetchAllOptions {
    authController:    AuthController
    fetchNicknames?:   boolean
    fetchIcon?:        boolean
    deferIconLoading?: boolean
    acceptInvalid?:    boolean
}

export interface FetchOptions {
    login:             string
    authController:    AuthController
    fetchNicknames?:   boolean
    fetchIcon?:        boolean
    deferIconLoading?: boolean
    acceptInvalid?:    boolean
}

export interface UpdatedOptions {
    updateNicknames?:  boolean
    updateIcon?:       boolean
    deferIconLoading?: boolean
    authController:    AuthController
}

export interface MakeIconOptions {
    login: string
    name?: string | null
    size?: number
}

export interface RegisterUserOptions {
    authController: AuthController
    login:          string
    password:       string
    name?:          string | null
    isAdmin?:       boolean
}

export interface SendPasswordOptions {
    authController: AuthController
    login:          string
    password:       string
}

export interface SendNameOptions {
    authController: AuthController
    login:          string
    name:           string | null
}

export interface SendIconOptions {
    authController: AuthController
    login:          string
    icon:           string | null
}

export interface SendIsAdminOptions {
    authController: AuthController
    login:          string
    isAdmin:        boolean
}

export interface SendNicknamesOptions {
    authController: AuthController
    login:          string
    nicknames:      string[]
}

export interface SendOptions {
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
        icon:      z.string().nullish().or(z.string().optional().promise()),
        reg:       z.object({
            time:  z.coerce.date().nullish(),
            login: z.string().nullish()
        }).nullish()
    })

    static readonly USERS_JSON_SCHEMA = this.USER_JSON_SCHEMA.array()

    static readonly ICON_JSON_SCHEMA = z.object({
        icon: z.string().nullish()
    })

    static async fetchIcon(authController: AuthController, login: string): Promise<string | undefined> {
        const method   = this.makeMethod(login, "icon")
        const [json]   = await get(authController, method)
        const { icon } = this.ICON_JSON_SCHEMA.parse(json)

        return icon ?? undefined
    }

    static async fetchAll(options: FetchAllOptions): Promise<User[]> {
        const {
            authController,
            fetchNicknames,
            fetchIcon,
            acceptInvalid,
            deferIconLoading,
        } = options

        const [jsons] = await get(authController, "users", {
            urlOptions: {
                nicknames: fetchNicknames,
                icon:      fetchIcon,
            },
        })

        return this.fromJsons(jsons, {
            authController,
            acceptInvalid,
            deferIconLoading,
        })
    }

    static fromJsons(jsons: any, options: FromJsonOptions = {}): User[] {
        return this.USERS_JSON_SCHEMA
            .parse(jsons)
            .map(parsed => new User({
                ...parsed,
                ...options
            }))
    }

    static async fetch(options: FetchOptions): Promise<User> {
        const {
            authController,
            fetchNicknames,
            fetchIcon,
            login,
            acceptInvalid,
            deferIconLoading,
        } = options

        const [json] = await get(authController, this.makeMethod(login), {
            urlOptions: {
                nicknames: fetchNicknames,
                icon:      fetchIcon
            },
        })

        return User.fromJson(json, {
            authController,
            acceptInvalid,
            deferIconLoading,
        })
    }

    static fromJson(json: any, options: FromJsonOptions = {}): User {
        return new User({
            ...this.USER_JSON_SCHEMA.parse(json),
            ...options,
        })
    }

    static readonly LOGIN_COOKIE_NAME = "login"

    static checkLogin(login: string): string {
        return this.checkNormedLogin(this.normLogin(login))
    }

    static checkNormedLogin(login: string): string {
        const invalidReason = this.validateNormedLogin(login)

        if (invalidReason != null)
            throw new Error(invalidReason)

        return login
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

    static checkPassword(password: string): string {
        const invalidReason = this.validatePassword(password)

        if (invalidReason != null)
            throw new Error(invalidReason)

        return password
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

    static checkName(name: undefined | null):          undefined
    static checkName(name: string | undefined | null): string | undefined
    static checkName(name: string | undefined | null): string | undefined {
        return this.checkNormedName(this.normName(name))
    }

    static checkNormedName(name: undefined):          undefined
    static checkNormedName(name: string | undefined): string | undefined
    static checkNormedName(name: string | undefined): string | undefined {
        const invalidReason = this.validateNormedName(name)

        if (invalidReason != null)
            throw new Error(invalidReason)

        return name
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

    static checkNicknames(nicknames: string[]):                    string[]
    static checkNicknames(nicknames: undefined | null):            undefined
    static checkNicknames(nicknames: string[] | undefined | null): string[] | undefined
    static checkNicknames(nicknames: string[] | undefined | null): string[] | undefined {
        return this.checkNormedNicknames(this.normNicknames(nicknames))
    }

    static checkNormedNicknames(nicknames: string[] | undefined): string[] | undefined {
        if (nicknames)
            for (const nickname of nicknames)
                this.checkNormedNickname(nickname)

        return nicknames
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

    static checkNickname(nickname: string): string {
        return this.checkNormedNickname(this.normNickname(nickname))
    }

    static checkNormedNickname(nickname: string): string {
        const invalidReason = this.validateNormedNickname(nickname)

        if (invalidReason != null)
            throw new Error(invalidReason)

        return nickname
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

    static readonly MAX_ICON_SIZE = 512

    static renderDefaultIcon(options: MakeIconOptions): string {
        const FONT_SIZE_SCALE_FACTOR = .8

        const name   = (options.name ?? options.login).trim()
        const size   =  options.size ?? this.MAX_ICON_SIZE
        const canvas =  document.createElement("canvas")

        canvas.width  = size
        canvas.height = size

        const context = canvas.getContext("2d")

        if (context == null)
            throw new Error("Canvas is not supported")

        context.fillStyle = "black"

        context.fillRect(0, 0, size, size)

        const text         = makeIconText()
        const initFontSize = size

        context.font         = `${size}px sans-serif`
        context.textBaseline = "middle"
        context.textAlign    = "center"
        context.fillStyle    = "white"

        const metrics  = context.measureText(text)
        const fontSize = FONT_SIZE_SCALE_FACTOR * Math.min(size * initFontSize / metrics.width, size)

        context.font =`${fontSize}px sans-serif`

        const heightDelta = evalHeightDelta()
        const halfSize    = size / 2

        context.fillText(text, halfSize, halfSize + heightDelta)

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
        await del(authController, this.makeMethod(login))
    }

    static async register(options: RegisterUserOptions): Promise<User> {
        const {
            authController,
            login,
            isAdmin,
        } = options

        const method   = this.makeMethod(login)
        const password = this.checkPassword(options.password)
        const name     = this.checkName(options.name)
    
        await post(authController, method, {
            body: {
                name,
                password,
                isAdmin,
            },
        })

        return new User({ login, name, isAdmin })
    }

    static async sendPassword(options: SendPasswordOptions) {
        const {
            authController,
            login,
        } = options

        const method   = this.makeMethod(login, "password")
        const password = this.checkPassword(options.password)
        
        await put(authController, method, {
            body: { password },
        })
    }

    static async sendName(options: SendNameOptions) {
        const {
            authController,
            login
        } = options

        const method = this.makeMethod(login, "name")
        const name   = this.checkName(options.name) ?? null

        await put(authController, method, {
            body: { name },
        })
    }

    static async sendIcon(options: SendIconOptions) {
        const {
            authController,
            login,
            icon,
        } = options

        const method = this.makeMethod(login, "icon")

        await put(authController, method, {
            body: { icon },
        })
    }

    static async sendIsAdmin(options: SendIsAdminOptions) {
        const {
            authController,
            login,
            isAdmin,
        } = options

        const method = this.makeMethod(login, "is-admin")

        await put(authController, method, {
            body: { isAdmin },
        })
    }

    static readonly MAX_NICKNAMES_JSON_SCHMEA = z.object({
        max: z.number()
    })

    static async fetchMaxNicknames(authController: AuthController): Promise<number> {
        const [json]  = await get(authController, "max-nicknames")
        const { max } = this.MAX_NICKNAMES_JSON_SCHMEA.parse(json)

        return max
    }

    static async sendNicknames(options: SendNicknamesOptions) {
        const {
            authController,
            login,
        } = options

        const method    = this.makeMethod(login, "nicknames")
        const nicknames = this.checkNicknames(options.nicknames)

        await put(authController, method, {
            body: nicknames
        })
    }

    static async send(options: SendOptions) {
        const {
            authController,
            login,
            icon,
            isAdmin,
        } = options

        const method = this.makeMethod(login)

        const name = options.name !== undefined ? this.checkName(options.name) ?? null
                                                : undefined

        const nicknames = this.checkNicknames(options.nicknames)

        await put(authController, method, {
            body: {
                isAdmin,
                name,
                icon,
                nicknames,
            },
        })
    }

    static makeMethod(login: string, property?: string): string {
        const normedLogin = this.checkLogin(login)

        return property ? `users/${normedLogin}/${property}`
                        : `users/${normedLogin}`
    }
    
    static sort(users: User[]): typeof users {
        return users.sort(this.collate)
    }

    static collate(lhs: User, rhs: User): -1 | 0 | 1 {
        if (lhs.isAdmin && !rhs.isAdmin)
            return -1

        if (!lhs.isAdmin && rhs.isAdmin)
            return 1

        const lhsDisplayName = lhs.displayName
        const rhsDisplayName = rhs.displayName

        if (lhsDisplayName > rhsDisplayName)
            return 1

        if (lhsDisplayName < rhsDisplayName)
            return -1

        return 0
    }

    readonly login:        string
    readonly name?:        string
    readonly nicknames?:   string[]
    readonly isAdmin:      boolean
    readonly isOnline:     boolean
    readonly icon?:        string | Promise<string | undefined>
    readonly displayIcon:  string
    readonly reg: {
        readonly time:     Date
        readonly login?:   string
    }

    constructor(options: CreationOptions) {
        const {
            acceptInvalid,
            deferIconLoading,
            authController
        } = options

        const validate  = !acceptInvalid

        const login     = User.normLogin(options.login)
        const name      = User.normName(options.name)
        const nicknames = User.normNicknames(options.nicknames)

        if (validate) {
            User.checkNormedLogin(login)
            User.checkNormedName(name)
            User.checkNormedNicknames(nicknames)
        }

        const isAdmin      =  options.isAdmin    ?? false
        const isOnline     =  options.isOnline   ?? false
        const regTime      =  options.reg?.time  ?? new Date()
        const regLogin     =  options.reg?.login ?? undefined
        const displayIcon  =  options.icon       == null
                           || options.icon instanceof Promise
                           ?  User.renderDefaultIcon({ login, name })
                           :  options.icon
        const icon         =  deferIconLoading
                           && options.icon       == null
                           && authController     != null
                           ?  User.fetchIcon(authController, login)
                           :  options.icon       ?? undefined
                          
        this.login         =  login
        this.name          =  name
        this.nicknames     =  nicknames
        this.isAdmin       =  isAdmin
        this.isOnline      =  isOnline
        this.icon          =  icon
        this.displayIcon   =  displayIcon
        this.reg           =  {
            time:  regTime,
            login: regLogin
        }
    }

    get iconLoading(): boolean {
        return this.icon instanceof Promise
    }

    get displayName(): string {
        return this.name ?? this.login
    }

    async updated(options: UpdatedOptions): Promise<User> {
        const {
            authController,
            updateNicknames,
            updateIcon,
            deferIconLoading,
        } = options

        return await User.fetch({
            authController,
            deferIconLoading,
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

    withName(name: string | undefined): User {
        User.checkName(name)

        return new User({
            ...this,
            name,
            acceptInvalid: true,
        })
    }

    withIsAdmin(isAdmin: boolean): User {
        return new User({
            ...this,
            isAdmin,
            acceptInvalid: true,
        })
    }

    withNicknames(nicknames: string[]): User {
        User.checkNicknames(nicknames)

        return new User({
            ...this,
            nicknames,
            acceptInvalid: true,
        })
    }

    withIcon(icon: string | undefined): User {
        return new User({
            ...this,
            icon,
            acceptInvalid: true,
        })
    }

    equalTo(user: User): boolean {
        return User.areLoginsEqual(this.login, user.login)
            && User.areNicknamesEqual(this.nicknames, user.nicknames)
            && this.name        === user.name
            && this.isAdmin     === user.isAdmin
            && this.displayIcon === user.displayIcon
    }

    collate(user: User): -1 | 0 | 1 {
        return User.collate(this, user)
    }

    async saveDiff(authController: AuthController, user: User) {
        const { login } = this
        const name      = this.name        === user.name                         ? undefined : this.name        ?? null
        const icon      = this.displayIcon === user.displayIcon                  ? undefined : this.displayIcon ?? null
        const isAdmin   = this.isAdmin     === user.isAdmin                      ? undefined : this.isAdmin
        const nicknames = User.areNicknamesEqual(this.nicknames, user.nicknames) ? undefined : this.nicknames

        await User.send({
            authController,
            login,
            name,
            icon,
            isAdmin,
            nicknames,
        })
    }
}