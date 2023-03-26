import z          from "zod"
import LogicError from "./LogicError";
import TokenPair  from "./TokenPair";
import User       from "./User";

import { encode } from "js-base64";

export type CreationOptions = AuthorizedCreationOptions
                            | UnauthroizedCreationOptions

export interface AuthorizedCreationOptions {
    readonly isAnonymAccessAllowed?: boolean
    readonly tokenPair:              TokenPair
    readonly user:                   User
}

export interface UnauthroizedCreationOptions {
    readonly isAnonymAccessAllowed?: boolean
    readonly tokenPair?:             undefined
    readonly user?:                  undefined
}

export type State = "authorized"
                  | "authorizing"
                  | "unauthorized"
                  | "unauthorizing"

export default class ApiManager {
    private static _instance:        ApiManager          | null
    private static _instancePromise: Promise<ApiManager> | null

    static get instance(): ApiManager {
        if (this._instance == null)
            throw new Error("ApiManager isn't loaded")

        return this._instance
    }

    static async laod(): Promise<ApiManager> {
        if (this._instance != null)
            return this._instance

        if (this._instancePromise == null)
            this._instancePromise = create()

        return this._instance = await this._instancePromise

        async function create() {
            const manager = new ApiManager()

            try {
                await manager.updateIsAnonymAccessAllowed()
            } catch (error) {
                const newError = new Error("Failed to update access level", { cause: error })
                console.error(newError)
            }

            return manager
        }
    }

    private _isAnonymAccessAllowed: boolean
    private _tokenPair:             TokenPair | null
    private _user:                  User      | null
    private _state:                 State

    constructor(options: CreationOptions = {}) {
        const { isAnonymAccessAllowed, tokenPair, user } = options

        this._isAnonymAccessAllowed = isAnonymAccessAllowed ?? false

        if (tokenPair == null) {
            this._tokenPair = null
            this._user      = null
            this._state     = "unauthorized"
            return
        }

        this._tokenPair = tokenPair
        this._user      = user
        this._state     = "authorized"
    }

    save() {
        this._tokenPair?.save()
        this._user?.save()
    }

    get isAnonymAccessAllowed(): boolean {
        return this._isAnonymAccessAllowed
    }

    private static readonly IS_ANONYM_ACCESS_ALLOWED_SCHEMA = z.object({
        allowed: z.boolean()
    })

    async updateIsAnonymAccessAllowed() {
        const response = await fetch("/api/anonym-access-allowed", { cache: "no-store" })
        
        if (!response.ok)
            throw new Error(response.statusText)

        const json        = await response.json()
        const { allowed } = ApiManager.IS_ANONYM_ACCESS_ALLOWED_SCHEMA.parse(json)

        this._isAnonymAccessAllowed = allowed
    }

    get tokenPair(): TokenPair | null {
        return this._tokenPair
    }

    get user(): User | null {
        return this._user
    }

    get state(): State {
        return this._state
    }

    async auth(login: string, password: string) {
        this.checkState("unauthorized", "authorize")
        this._state = "authorizing"

        try {
            const base64Login    = encode(login)
            const base64Password = encode(password)
            const Authorization  = `${base64Login}:${base64Password}`
            const method         = "POST"
            const headers        = new Headers({ Authorization })
            const result         = await fetch("/api/auth", { method, headers })

            if (!result.ok)
                throw new Error(result.statusText)

            const json = await result.json()

            if (json.error)
                throw new LogicError(json.error)

            this._tokenPair = TokenPair.fromJson(json)
            this._user      = new User({ login })
            this._state     = "authorized"
        } catch (error) {
            this._state = "unauthorized"
            throw error
        }
    }

    async deauth() {
        this.checkState("authorized", "deauthorize")
        this._state = "unauthorizing"

        try {
            const method        = "POST"
            const Authorization = this.tokenPair!.access.id
            const headers       = new Headers({ Authorization })
            const response      = await fetch("/api/deauth", { method, headers })

            if (!response.ok)
                throw new Error(response.statusText)

            const json = await response.json()

            if (json.error)
                throw new LogicError(json.error)
        } finally {
            this._tokenPair = null
            this._user      = null
            this._state     = "unauthorized"
        }
    }

    async reauth(refreshTokenId: string): Promise<TokenPair> {
        // TODO
        return {} as TokenPair
    }

    private checkState(required: State, action: string) {
        if (this.state === required)
            return

        const message = `Cannot ${action} while in "${this.state}" state. "${required}" state is required`
        throw new Error(message)
    }
}