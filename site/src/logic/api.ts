import AuthInfo   from "./AuthInfo";
import LogicError from "./LogicError";
import Token      from "./Token";
import TokenPair  from "./TokenPair";

import { encode } from "js-base64";

export interface AuthControler {
    authInfo:    AuthInfo
    setAuthInfo: SetAuthInfo
}

export type SetAuthInfo = (authInfo: AuthInfo) => void

export async function auth(login: string, password: string, authControl?: AuthControler): Promise<TokenPair> {
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
        throw new LogicError(String(json.error))

    const tokenPair = TokenPair.fromJson(json)

    if (authControl != null) {
        const { setAuthInfo, authInfo} = authControl
        setAuthInfo(authInfo.withTokenPair(tokenPair))
    }

    return tokenPair
}

const reauthingIds = new Map<string, Promise<TokenPair>>()

export async function reauth(rTokenId: string): Promise<TokenPair> {
    rTokenId = Token.normId(rTokenId)

    let promise = reauthingIds.get(rTokenId)

    if (promise == null) {
        promise = reauthPromise()
        reauthingIds.set(rTokenId, promise)
    }

    try {
        return await promise
    } finally {
        reauthingIds.delete(rTokenId)
    }

    async function reauthPromise(): Promise<TokenPair> {
        const method   = "POST"
        const headers  = new Headers({ Authorization: rTokenId })
        const response = await fetch("/api/reauth", { method, headers })

        if (!response.ok)
            throw new Error(response.statusText)

        const json = await response.json()

        if (json.error)
            throw new LogicError(String(json.error))

        return TokenPair.fromJson(json)
    }
}

export async function deauth(authInfo: AuthInfo, setAuthInfo?: SetAuthInfo) {
    const { tokenPair } = authInfo

    if (tokenPair == null)
        return

    const method        = "POST"
    const Authorization = tokenPair.access.id
    const headers       = new Headers({ Authorization })
    const response      = await fetch("/api/deauth", { method, headers })

    if (!response.ok)
        throw new Error(response.statusText)

    const json = await response.json()

    if (json.error)
        throw new LogicError(String(json.error))

    setAuthInfo?.(authInfo.withoutTokenPair())
}