import AuthInfo   from "logic/AuthInfo";
import LogicError from "logic/LogicError";

export async function deauth(authInfo: AuthInfo) {
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
}