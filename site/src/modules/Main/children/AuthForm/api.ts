import TokenPair  from "logic/TokenPair";
import LogicError from "logic/LogicError";

import { encode } from "js-base64";

export async function auth(login: string, password: string): Promise<TokenPair> {
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

    return TokenPair.fromJson(json)
}