import { FormEvent, useState } from "react"

import "./style.css"

export default function SignIn() {
    const [loginError,    setLoginError   ] = useState(undefined as undefined | string)
    const [passwordError, setPasswordError] = useState(undefined as undefined | string)

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
    }

    const onLoginInput = (e: FormEvent<HTMLInputElement>) => {
        const error = validateLogin(e.currentTarget.value)
        setLoginError(error)
    }

    const onPasswordInput = (e: FormEvent<HTMLInputElement>) => {
        const error = validatePassword(e.currentTarget.value)
        setPasswordError(error)
    }

    return <form className="SignIn" onSubmit={onSubmit}>
        <fieldset> 
            <legend>Sign In</legend>
            <input className={className("login",    loginError   )} type="text"     placeholder="Login"    onInput={onLoginInput}    />
            <p className="error-message">{loginError}</p>
            <input className={className("password", passwordError)} type="password" placeholder="Password" onInput={onPasswordInput} />
            <p className="error-message">{passwordError}</p>
            <input className="submit"                               type="submit"   value="Sign In"                                  />
        </fieldset>
    </form>

    function className(base: string, error: any): string {
        return error == null ? base : base + " error"
    }

    function validateLogin(login: string): string | undefined {
        if (login.match(/\s/))
            return "Login must not contain with white space"

        const MIN_LENGTH = 4

        if (login.length < MIN_LENGTH)
            return `Login must be at least ${MIN_LENGTH} characters long`

        return undefined
    }

    function validatePassword(password: string): string | undefined {
        const MIN_LENGTH = 8

        return password.length < MIN_LENGTH ? `Password must be at least ${MIN_LENGTH} characters long`
                                            : undefined
    }
}