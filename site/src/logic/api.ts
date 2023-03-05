import NeedAuthError from "./NeedAuthError"
import LogicError    from "./LogicError"

import { readTokenPairFromCookies, saveTokenPairToCookies, tokenPairFromJson } from "./token"

export async function get(path: string): Promise<any> {
    return await method("GET", path)
}

export async function post(path: string): Promise<any> {
    return await method("POST", path)
}

export async function del(path: string): Promise<any> {
    return await method("DELETE", path)
}

export async function PUT(path: string): Promise<any> {
    return await method("PUT", path)
}

export async function method(method: Method, path: string): Promise<any> {
    const tokenPair = readTokenPairFromCookies()

    if (!tokenPair)
        throw new NeedAuthError()

    path = "/api/" + path

    if (tokenPair.access.exp > new Date()) {
        // First try

        const headers = new Headers()

        headers.set("Authorization", tokenPair.access.id)

        const result = await fetch(path, { method, headers, cache: "no-store" })

        if (!result.ok)
            throw new Error(result.statusText)

        const json = await result.json()

        if (!json.error)
            return json

        if (!json.needRefresh)
            throw new LogicError(json.error)
    }

    if (tokenPair.refresh.exp < new Date())
        throw new NeedAuthError()

    // Reauthentication

    const headers = new Headers()

    headers.set("Authorization", tokenPair.refresh.id)

    const result = await fetch("/api/reauth", { method: "POST", headers })

    if (!result.ok)
        throw new NeedAuthError(result.statusText)

    const json = await result.json()

    if (json.error)
        throw new NeedAuthError(json.error)

    try {
        // Second try (last)

        const tokenPair = tokenPairFromJson(json)

        saveTokenPairToCookies(tokenPair)

        const headers = new Headers()

        headers.set("Authorization", tokenPair.access.id)

        const result = await fetch(path, { method, headers: headers, cache: "no-cache" })

        if (!result.ok)
            throw new Error(result.statusText)

        const newJson = await result.json()

        if (newJson.error)
            throw newJson.needRefresh ? new NeedAuthError(newJson.error)
                                      : new LogicError(newJson.error)

        return newJson
    } catch (error) {
        if (error instanceof Error)
            throw new NeedAuthError(error.message, error)

        throw new NeedAuthError()
    }
}

export type Method = "GET" | "POST" | "DELETE" | "PUT"