export function auth(login: string, password: string) {

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

    const MAX_LENGTH = 4

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