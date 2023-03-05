import Cookies    from "js-cookie"
import LogicError from "./LogicError"

import { encode                      } from "js-base64"
import { readTokenPairFromCookies,
         removeTokenPairFromCookies,
         saveTokenPairJsonToCookies  } from "./token"

export async function auth(login: string, password: string) {
    checkLogin(login)
    checkPassword(password)

    const headers = new Headers()

    headers.set("Authorization", encode(login) + ":" + encode(password))

    const result = await fetch("/api/auth", { method: "POST", headers })

    if (!result.ok)
        throw new Error(result.statusText)

    const json = await result.json()

    if (json.error)
        throw new LogicError(json.error)

    saveTokenPairJsonToCookies(json)
    safeLoginToCookies(login)
}

export async function deauth(force: boolean = false) {
    try {
        const tokenPair = readTokenPairFromCookies()

        if (tokenPair == null)
            throw new LogicError("Not authorized")

        const headers = new Headers()

        headers.set("Authorization", tokenPair.access.id)

        const result = await fetch("/api/deauth", { method: "POST", headers })

        if (!result.ok)
            throw new Error(result.statusText)

        const json = await result.json()

        if (json.error)
            throw new LogicError(json.error)

        removeTokenPairFromCookies()
        removeLoginFromCookies()
    } catch (error) {
        if (force) {
            removeTokenPairFromCookies()
            removeLoginFromCookies()
        }

        throw error
    }
}

export const LOGIN_COOKIE_NAME = "login"

export function safeLoginToCookies(login: string) {
    Cookies.set(LOGIN_COOKIE_NAME, login, {
        expires:  3650,
        sameSite: "strict"
    })
}

export function readLoginFromCookies(): string | undefined {
    const login = Cookies.get(LOGIN_COOKIE_NAME)

    if (login == null)
        return undefined

    if (validateLogin(login)) {
        Cookies.remove(LOGIN_COOKIE_NAME)
        return undefined
    }

    return login
}

export function removeLoginFromCookies() {
    Cookies.remove(LOGIN_COOKIE_NAME, { sameSite: "strict" })
}

export function checkLogin(login: string) {
    const invalidReason = validateLogin(login)
    
    if (invalidReason != null)
        throw new Error(invalidReason)
}

export function validateLogin(login: string): string | undefined {
    const MIN_LENGTH = 4

    if (login.length < MIN_LENGTH)
        return `Login must be at least ${MIN_LENGTH} characters long`

    const MAX_LENGTH = 255

    if (login.length > MAX_LENGTH)
        return `Login must not be longer than ${MAX_LENGTH} characters`

    if (login.match(/\s/))
        return "Login must not contain with white space"

    return undefined
}

export function checkPassword(password: string) {
    const invalidReason = validatePassword(password)
    
    if (invalidReason != null)
        throw new Error(invalidReason)
}

export function validatePassword(password: string): string | undefined {
    const MIN_LENGTH = 4

    if (password.length < MIN_LENGTH)
        return `Password must be at least ${MIN_LENGTH} characters long`

    const MAX_LENGTH = 255

    if (password.length > MAX_LENGTH)
        return `Password must not be longer than ${MAX_LENGTH} characters`

    return undefined
}