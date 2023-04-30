import z          from "zod"
import AuthInfo   from "./AuthInfo";
import LogicError from "./LogicError";
import TokenPair  from "./TokenPair";

import { encode } from "js-base64";

export const API_PREFIX = "/api"

export type AuthController = [AuthInfo, SetAuthInfo]

export type SetAuthInfo = (authInfo: AuthInfo) => void

export type HttpMethod = "get"
                       | "post"
                       | "delete"
                       | "put"

export interface ApiOptions {
    urlOptions?: UrlOptions
    headers?:    Headers
    body?:       any
}

export type ApiResult = [any, AuthInfo]

export type UrlOptions = {
    [key: string]: any
}

const IS_ANONYM_ACCESS_ALLOWED_SCHEMA = z.object({
    allowed: z.boolean()
})

export async function isAnonymAccessAllowed() {
    const response = await fetch(makeUrl("anonym-access-allowed"), { cache: "no-store" })
    
    if (!response.ok)
        throw new Error(response.statusText)

    const json        = await response.json()
    const { allowed } = IS_ANONYM_ACCESS_ALLOWED_SCHEMA.parse(json)

    return allowed
}

export async function auth(authController: AuthController, login: string, password: string): Promise<AuthInfo> {
    const base64Login    = encode(login)
    const base64Password = encode(password)
    const Authorization  = `${base64Login}:${base64Password}`
    const method         = "POST"
    const headers        = new Headers({ Authorization })
    const result         = await fetch(makeUrl("auth"), { method, headers })

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
        const response = await fetch(makeUrl("reauth"), { method, headers })

        if (!response.ok)
            throw new Error(response.statusText)

        const json = await response.json()

        if (json.error) {
            const newAuthInfo = authInfo.withoutTokenPair()
            setAuthInfo(newAuthInfo)
            throw new LogicError(String(json.error))
        }

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
    const response      = await fetch(makeUrl("deauth"), { method, headers })

    if (!response.ok)
        throw new Error(response.statusText)

    const json = await response.json()

    if (json.error)
        throw new LogicError(String(json.error))

    const newAuthInfo = authInfo.withoutTokenPair()

    setAuthInfo(newAuthInfo)

    return newAuthInfo
}

export async function get(authController: AuthController, apiMethod: string, options?: ApiOptions) {
    return await api(authController, "get", apiMethod, options)
}

export async function post(authController: AuthController, apiMethod: string, options?: ApiOptions) {
    return await api(authController, "post", apiMethod, options)
}

export async function put(authController: AuthController, apiMethod: string, options?: ApiOptions) {
    return await api(authController, "put", apiMethod, options)
}

export async function del(authController: AuthController, apiMethod: string, options?: ApiOptions) {
    return await api(authController, "delete", apiMethod, options)
}

export async function api(authController: AuthController, httpMethod: HttpMethod, apiMethod: string, options?: ApiOptions): Promise<ApiResult> {
    const url     = makeUrl(apiMethod, options?.urlOptions)
    const headers = options?.headers ?? new Headers()
    let   body    = options?.body

    headers.set("Accept", "application/json")

    if (body !== undefined) {
        headers.set("Content-Type", "application/json")
        body = JSON.stringify(body)
    }

    const [authInfo, setAuthInfo] = authController
    const { tokenPair           } = authInfo

    let newerAuthInfo: AuthInfo | undefined

    if (tokenPair == null)
        return await fetchApiAsAnonym()

    if (tokenPair.refreshExpired)
        refreshExpired()

    if (tokenPair.accessExpired)
        await accessExpired()

    return await fetchApi()

    async function fetchApiAsAnonym(): Promise<ApiResult> {
        if (!authInfo.allowAnonymAccess)
            throw new Error("Anonymous access is forbidden")

        const response = await fetchApiRaw()

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

    async function fetchApi(): Promise<ApiResult> {
        let effectiveAuthInfo = newerAuthInfo ?? authInfo
        let response          = await fetchApiAuthorized()

        if (!response.ok)
            throw new Error(response.statusText)

        let json = await response.json()

        if (json.error) {
            if (!json.needRefresh)
                throw new LogicError(String(json.error))

            effectiveAuthInfo = await reauth([effectiveAuthInfo, setAuthInfo])
            response          = await fetchApiAuthorized()

            if (!response.ok)
                throw new Error(response.statusText)

            json = await response.json()

            if (json.error)
                throw new LogicError(String(json.error))
        }

        return [json, effectiveAuthInfo]

        async function fetchApiAuthorized() {
            effectiveAuthInfo.modifyHeaders(headers)

            if (body)
                headers.set("Content-Type", "application/json")

            return await fetchApiRaw()
        }
    }

    function fetchApiRaw() {
        return fetch(url, {
            method: httpMethod,
            headers,
            body,
            cache:  "no-store"
        })
    }
}

export function makeUrl(apiMethod: string, options: UrlOptions = {}): string {
    const urlApiMethod = encodeURI(`${API_PREFIX}/${apiMethod}`)
    const urlOptions   = Object
        .entries(options)
        .map(([key, value]) => {
            if (!value)
                return null

            const urlKey = encodeURIComponent(key)

            if (typeof value === "boolean")
                return urlKey

            const urlValue = encodeURIComponent(String(value))

            return `${urlKey}=${urlValue}`
        })
        .filter(option => option)
        .join("&")

    return `${urlApiMethod}?${urlOptions}`
}