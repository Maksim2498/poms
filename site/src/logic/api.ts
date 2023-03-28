import AuthInfo   from "./AuthInfo";
import LogicError from "./LogicError";
import TokenPair  from "./TokenPair";

import { encode } from "js-base64";

export type AuthController = [AuthInfo, SetAuthInfo]

export type SetAuthInfo = (authInfo: AuthInfo) => void

export type Method = "get"
                   | "post"
                   | "update"
                   | "delete"

export type ApiResult = [any, AuthInfo]

export async function auth(authController: AuthController, login: string, password: string): Promise<AuthInfo> {
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

    const tokenPair               = TokenPair.fromJson(json)
    const [authInfo, setAuthInfo] = authController
    const newAuthInfo             = authInfo.withTokenPair(tokenPair)

    setAuthInfo(newAuthInfo)

    return newAuthInfo
}

const reauthingIds = new Map<string, Promise<AuthInfo>>()

export async function reauth(authController: AuthController): Promise<AuthInfo> {
    const [authInfo, setAuthInfo] = authController
    const { tokenPair           } = authInfo

    if (tokenPair == null)
        throw new Error("Not authorized")

    const rTokenId = tokenPair.refresh.id
    let   promise  = reauthingIds.get(rTokenId)

    if (promise == null) {
        promise = reauthPromise()
        reauthingIds.set(rTokenId, promise)
    }

    try {
        return await promise
    } finally {
        reauthingIds.delete(rTokenId)
    }

    async function reauthPromise(): Promise<AuthInfo> {
        const method   = "POST"
        const headers  = new Headers({ Authorization: rTokenId })
        const response = await fetch("/api/reauth", { method, headers })

        if (!response.ok)
            throw new Error(response.statusText)

        const json = await response.json()

        if (json.error)
            throw new LogicError(String(json.error))

        const newTokenPair = TokenPair.fromJson(json)
        const newAuthInfo  = authInfo.withTokenPair(newTokenPair)

        setAuthInfo(newAuthInfo)

        return newAuthInfo
    }
}

export async function deauth(authController: AuthController): Promise<AuthInfo> {
    const [authInfo, setAuthInfo] = authController
    const { tokenPair           } = authInfo

    if (tokenPair == null)
        return authInfo

    const method        = "POST"
    const Authorization = tokenPair.access.id
    const headers       = new Headers({ Authorization })
    const response      = await fetch("/api/deauth", { method, headers })

    if (!response.ok)
        throw new Error(response.statusText)

    const json = await response.json()

    if (json.error)
        throw new LogicError(String(json.error))

    const newAuthInfo = authInfo.withoutTokenPair()

    setAuthInfo(newAuthInfo)

    return newAuthInfo
}

export async function get(authController: AuthController, url: string) {
    return await api(authController, "get", url)
}

export async function post(authController: AuthController, url: string) {
    return await api(authController, "post", url)
}

export async function update(authController: AuthController, url: string) {
    return await api(authController, "update", url)
}

export async function del(authController: AuthController, url: string) {
    return await api(authController, "delete", url)
}

export async function api(authController: AuthController, method: Method, url: string): Promise<ApiResult> {
    url = "/api/" + url

    const [authInfo, setAuthInfo] = authController
    const { tokenPair           } = authInfo

    let newerAuthInfo: AuthInfo | undefined

    if (tokenPair == null)
        return await tryFetchAsAnonym()

    if (tokenPair.refreshExpired)
        refreshExpired()

    if (tokenPair.accessExpired)
        await accessExpired()

    return await tryFetch()

    async function tryFetchAsAnonym(): Promise<ApiResult> {
        if (!authInfo.allowAnonymAccess)
            throw new Error("Anonymous access is forbidden")

        const response = await fetch(url, { method, cache: "no-store" })

        if (!response.ok)
            throw new Error(response.statusText)

        const json = await response.json()

        if (json.error)
            throw new LogicError(String(json.error))

        return [json, authInfo]
    }

    function refreshExpired() {
        const newAuthInfo = authInfo.withoutTokenPair()

        setAuthInfo(newAuthInfo)

        throw new Error("Need to reauthenticate")
    }

    async function accessExpired() {
        newerAuthInfo = await reauth(authController)
    }

    async function tryFetch(): Promise<ApiResult> {
        let effectiveAuthInfo = newerAuthInfo ?? authInfo
        let response          = await fetch()

        if (!response.ok)
            throw new Error(response.statusText)

        let json = await response.json()

        if (json.error) {
            if (!json.needRefresh)
                throw new LogicError(String(json.error))

            effectiveAuthInfo = await reauth([effectiveAuthInfo, setAuthInfo])
            response          = await fetch()

            if (!response.ok)
                throw new Error(response.statusText)

            json = await response.json()

            if (json.error)
                throw new LogicError(String(json.error))
        }

        return [json, effectiveAuthInfo]

        async function fetch() {
            return await window.fetch(url, {
                method,
                headers: effectiveAuthInfo.toHeaders(),
                cache:   "no-store"
            })
        }
    }
}