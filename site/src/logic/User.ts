import Cookies   from "js-cookie"
import TokenPair from "./TokenPair"

export interface CreationOptions {
    readonly login:      string
    readonly name?:      string
    readonly nicknames?: string[]
    readonly isAdmin?:   boolean
    readonly isOnline?:  boolean
    readonly reg?: {
        readonly time?:  Date
        readonly login?: string | null
    }
}

export default class User {
    static readonly LOGIN_COOKIE_NAME = "login"

    static checkLogin(login: string) {
        const invalidReason = this.validateLogin(login)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validateLogin(login: string): string | null {
        const MIN_LENGTH = 4

        if (login.length < MIN_LENGTH)
            return `Login "${login}" is too short. Minimum ${MIN_LENGTH} characters required`

        const MAX_LENGTH = 255

        if (login.length > MAX_LENGTH)
            return `Login is too long. Maximum ${MAX_LENGTH} characters allowed`

        if (login.match(/\s/))
            return `Login "${login}" contains whitespace`

        return null
    }

    static checkPassword(password: string) {
        const invalidReason = this.validatePassword(password)

        if (invalidReason != null)
            throw new Error(invalidReason)
    }

    static validatePassword(password: string): string | null {
        const MIN_LENGTH = 4

        if (password.length < MIN_LENGTH)
            return `Password is too short. Minimum ${MIN_LENGTH} characters required`

        const MAX_LENGTH = 255

        if (password.length > MAX_LENGTH)
            return `Password is too long. Maximum ${MAX_LENGTH} characters allowed`

        return null
    }

    static remove() {
        this.removeLogin()
    }

    static async load(tokenPair: TokenPair): Promise<User> {
        const user = await this.safeLoad(tokenPair)

        if (user == null)
            throw new Error("Failed to load user")

        return user
    }

    static async safeLoad(tokenPair: TokenPair): Promise<User | null> {
        const login = this.safeLoadLogin()

        if (login == null)
            return null

        return new User({ login })
    }

    private static safeLoadLogin(): string | null {
        const login = Cookies.get(this.LOGIN_COOKIE_NAME)

        if (login == null)
            return null

        if (this.validateLogin(login) != null) {
            this.removeLogin()
            return null
        }

        return login
    }

    private static removeLogin() {
        Cookies.remove(this.LOGIN_COOKIE_NAME, { sameSite: "strict" })
    }

    readonly login:     string
    readonly name:      string | null
    readonly nicknames: string[]
    readonly isAdmin:   boolean
    readonly isOnline:  boolean
    readonly reg: {
        readonly time:  Date
        readonly login: string | null
    }

    constructor(options: CreationOptions) {
        this.login     = options.login
        this.name      = options.name      ?? null
        this.nicknames = options.nicknames ?? []
        this.isAdmin   = options.isAdmin   ?? false
        this.isOnline  = options.isOnline  ?? false
        this.reg       =  {
            time:  options.reg?.time       ?? new Date(),
            login: options.reg?.login      ?? null
        }
    }

    save() {
        this.saveLogin()
    }

    private saveLogin() {
        Cookies.set(User.LOGIN_COOKIE_NAME, this.login, {
            expires:  3650,
            sameSite: "strict"
        })
    }
}