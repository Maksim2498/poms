import z                    from "zod"
import AuthInfo             from "./AuthInfo";
import LogicError           from "./LogicError";
import TokenPair            from "./TokenPair";

import { MutableRefObject } from "react";
import { encode           } from "js-base64";

export const API_PREFIX = "/api"

export type AuthInfoRef = MutableRefObject<AuthInfo>

export type HttpMethod = "get"
                       | "post"
                       | "delete"
                       | "put"

export interface ApiOptions {
    urlOptions?: UrlOptions
    headers?:    Headers
    body?:       any
    signal?:     AbortSignal
}

export type UrlOptions = {
    [key: string]: any
}

const IS_ANONYM_ACCESS_ALLOWED_SCHEMA = z.object({
    allowed: z.boolean(),
})

export async function isAnonymAccessAllowed(signal?: AbortSignal): Promise<boolean> {
    const response = await fetch(makeUrl("anonym-access-allowed"), {
        cache: "no-store",
        signal,
    })
    
    if (!response.ok)
        throw new Error(response.statusText)

    const json        = await response.json()
    const { allowed } = IS_ANONYM_ACCESS_ALLOWED_SCHEMA.parse(json)

    return allowed
}

const IS_CONSOLE_AVAILABLE_SCHEMA = z.object({
    available: z.boolean(),
})

export async function isConsoleAvailable(authInfoRef: AuthInfoRef, signal?: AbortSignal): Promise<boolean> {
    const json          = await get(authInfoRef, "console-available", { signal })
    const { available } = IS_CONSOLE_AVAILABLE_SCHEMA.parse(json)

    return available
}

export async function auth(authInfoRef: AuthInfoRef, login: string, password: string, signal?: AbortSignal) {
    await deauth(authInfoRef, true, signal)

    const method         = "POST"
    const base64Login    = encode(login)
    const base64Password = encode(password)
    const Authorization  = `${base64Login}:${base64Password}`
    const headers        = new Headers({ Authorization })
    const result         = await fetch(makeUrl("auth"), { method, headers, signal })

    if (!result.ok)
        throw new Error(result.statusText)

    const json = await result.json()

    if (json.error)
        throw new LogicError(String(json.error))

    const tokenPair = TokenPair.fromJson(json)

    authInfoRef.current = authInfoRef.current.withTokenPair(tokenPair)
}

const reauthingIds = new Map<string, Promise<void>>()

export async function reauth(authInfoRef: AuthInfoRef, signal?: AbortSignal) {
    const { tokenPair } = authInfoRef.current

    if (tokenPair == null)
        throw new Error("Not authorized")

    const { id } = tokenPair.refresh

    let promise = reauthingIds.get(id)

    if (promise == null) {
        promise = reauthPromise()
        reauthingIds.set(id, promise)
    }

    try {
        await promise
    } finally {
        reauthingIds.delete(id)
    }

    async function reauthPromise() {
        const response = await fetch(makeUrl("reauth"), {
            method:  "POST",
            headers: authInfoRef.current.toRefreshHeaders(),
            signal,
        })

        if (!response.ok)
            throw new Error(response.statusText)

        const json = await response.json()

        if (json.error) {
            authInfoRef.current = authInfoRef.current.withoutTokenPair()
            throw new LogicError(String(json.error))
        }

        const newTokenPair = TokenPair.fromJson(json)

        authInfoRef.current = authInfoRef.current.withTokenPair(newTokenPair)
    }
}

export async function deauth(authInfoRef: AuthInfoRef, force: boolean = true, signal?: AbortSignal) {
    if (authInfoRef.current.tokenPair == null)
        return

    try {
        const response = await fetch(makeUrl("deauth"), {
            method:  "POST",
            headers: authInfoRef.current.toAccessHeaders(true),
            signal,
        })

        if (!response.ok)
            throw new Error(response.statusText)

        const json = await response.json()

        if (json.error)
            throw new LogicError(String(json.error))

        authInfoRef.current = authInfoRef.current.withoutTokenPair()
    } catch (error) {
        if (force) {
            console.error(error)
            authInfoRef.current = authInfoRef.current.withoutTokenPair()
            return
        }

        throw error
    }
}

export async function get(authInfoRef: AuthInfoRef, apiMethod: string, options?: ApiOptions): Promise<any> {
    return await api(authInfoRef, "get", apiMethod, options)
}

export async function post(authInfoRef: AuthInfoRef, apiMethod: string, options?: ApiOptions): Promise<any> {
    return await api(authInfoRef, "post", apiMethod, options)
}

export async function put(authInfoRef: AuthInfoRef, apiMethod: string, options?: ApiOptions): Promise<any> {
    return await api(authInfoRef, "put", apiMethod, options)
}

export async function del(authInfoRef: AuthInfoRef, apiMethod: string, options?: ApiOptions): Promise<any> {
    return await api(authInfoRef, "delete", apiMethod, options)
}

export async function api(authInfoRef: AuthInfoRef, httpMethod: HttpMethod, apiMethod: string, options?: ApiOptions): Promise<any> {
    const url     = makeUrl(apiMethod, options?.urlOptions)
    const headers = options?.headers ?? new Headers()
    let   body    = options?.body
    const signal  = options?.signal

    headers.set("Accept", "application/json")

    if (body !== undefined) {
        headers.set("Content-Type", "application/json")
        body = JSON.stringify(body)
    }

    const { tokenPair } = authInfoRef.current

    if (tokenPair == null) {
        if (authInfoRef.current.allowAnonymAccess)
            return await fetchApiRaw()

        throw new Error("Anonymous access is forbidden")
    }

    if (tokenPair.refresh.expired) {
        authInfoRef.current = authInfoRef.current.withoutTokenPair()
        throw new Error("Need to reauthenticate")
    }

    if (tokenPair.access.expired)
        await reauth(authInfoRef)

    authInfoRef.current.modifyAccessHeaders(headers)

    const json = await fetchApiRaw(false)

    if (json.error == null)
        return json

    if (!json.needRefresh)
        throw new LogicError(String(json.error))

    await reauth(authInfoRef)

    return await fetchApiRaw()

    async function fetchApiRaw(throwOnLogicError: boolean = true): Promise<any> {
        const response = await fetch(url, {
            method: httpMethod,
            headers,
            body,
            cache:  "no-store",
            signal,
        })

        if (!response.ok)
            throw new Error(response.statusText)

        const json = await response.json()

        if (throwOnLogicError && json.error)
            throw new LogicError(String(json.error))

        return json
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