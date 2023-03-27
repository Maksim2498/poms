import LogicError from "./LogicError";
import Token      from "./Token";
import TokenPair  from "./TokenPair";

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