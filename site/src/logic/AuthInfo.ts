import z          from "zod"
import Cookies    from "js-cookie";
import TokenPair  from "./TokenPair";

export interface CreationOptions {
    readonly allowAnonymAccess?: boolean
    readonly tokenPair?:         TokenPair
}

export type HeadersType = "access"
                        | "refresh"

export default class AuthInfo {
    static readonly ALLOW_ANONYM_ACCESS_COOKIE_NAME = "allow-anonym-access"

    static remove() {
        TokenPair.remove()
    }

    static load(): AuthInfo {
        const info = this.safeLoad()

        if (info == null)
            throw new Error("Failed to load auth. info")

        return info
    }

    static loadOrDefault(): AuthInfo {
        return this.safeLoad() ?? new AuthInfo()
    }

    static safeLoad(): AuthInfo | undefined {
        const allowAnonymAccess = loadAllowAnonymAccessOrDefault()
        const tokenPair         = TokenPair.safeLoad()

        return new AuthInfo({
            allowAnonymAccess,
            tokenPair
        })

        function loadAllowAnonymAccessOrDefault(): boolean {
            const cookie = Cookies.get(AuthInfo.ALLOW_ANONYM_ACCESS_COOKIE_NAME)?.trim()
                                                                                ?.toLocaleLowerCase()

            if (cookie == null)
                return false

            return cookie === "true"
        }
    }

    readonly allowAnonymAccess: boolean
    readonly tokenPair?:        TokenPair

    constructor(options: CreationOptions = {}) {
        this.allowAnonymAccess = options.allowAnonymAccess ?? false
        this.tokenPair         = options.tokenPair
    }

    withoutTokenPair(): AuthInfo {
        return this.withTokenPair(undefined)
    }

    withTokenPair(tokenPair: TokenPair | undefined): AuthInfo {
        return new AuthInfo({
            allowAnonymAccess: this.allowAnonymAccess,
            tokenPair,
        })
    }

    withAllowAnonymAccess(allowAnonymAccess: boolean): AuthInfo {
        return new AuthInfo({
            tokenPair: this.tokenPair,
            allowAnonymAccess
        })
    }

    private static readonly IS_ANONYM_ACCESS_ALLOWED_SCHEMA = z.object({
        allowed: z.boolean()
    })

    async withUpdatedAllowAnonymAccess(): Promise<AuthInfo> {
        const response = await fetch("/api/anonym-access-allowed", { cache: "no-store" })
        
        if (!response.ok)
            throw new Error(response.statusText)

        const json        = await response.json()
        const { allowed } = AuthInfo.IS_ANONYM_ACCESS_ALLOWED_SCHEMA.parse(json)

        return this.withAllowAnonymAccess(allowed)
    }

    save() {
        if (this.tokenPair == null)
            TokenPair.remove()
        else
            this.tokenPair.save()

        saveAllowAnonymAccess.call(this)

        function saveAllowAnonymAccess(this: AuthInfo) {
            Cookies.set(
                AuthInfo.ALLOW_ANONYM_ACCESS_COOKIE_NAME,
                String(this.allowAnonymAccess),
                { sameSite: "strict" }
            )
        }
    }

    toHeaders(type: HeadersType = "access"): Headers {
        const headers = new Headers()

        if (type === "refresh") {
            if (this.tokenPair == null)
                throw new Error("Missing refresh token")

            headers.set("Authorization", this.tokenPair.refresh.id)
        } else {
            if (this.tokenPair != null)
                headers.set("Authorization", this.tokenPair.access.id)
            else if (!this.allowAnonymAccess)
                throw new Error("Missing access token")
        }

        return headers
    }
}