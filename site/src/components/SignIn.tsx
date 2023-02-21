import Button from "./Button"

import { FormEvent, useState } from "react"

import "styles/SignIn.css"

export type Props = {
    onSignIn?: (login: string, password: string) => void
    onCancel?: () => void
}

export default function SignIn(props: Props) {
    const [login,         setLogin         ] = useState("")
    const [password,      setPassword      ] = useState("")
    const [loginError,    setLoginError    ] = useState(undefined as undefined | string)
    const [passwordError, setPasswordError ] = useState(undefined as undefined | string)
    const [typedLogin,    setTypedLogin    ] = useState(false)
    const [typedPassword, setTypedPassword ] = useState(false)

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
    }

    const onLoginInput = (e: FormEvent<HTMLInputElement>) => {
        const login = e.currentTarget.value
        const error = validateLogin(login)

        setLoginError(error)
        setTypedLogin(true)
        setLogin(login)
    }

    const onPasswordInput = (e: FormEvent<HTMLInputElement>) => {
        const password = e.currentTarget.value
        const error    = validatePassword(password)

        setPasswordError(error)
        setTypedPassword(true)
        setPassword(password)
    }

    const disabled = !typedLogin
                  || !typedPassword
                  || loginError    != null
                  || passwordError != null

    return <form className="SignIn" onSubmit={onSubmit}>
        <fieldset> 
            <legend>Sign In</legend>

            <input className   = {className("login", loginError)}
                   type        = "text"
                   placeholder = "Login"
                   value       = {login}
                   onInput     = {onLoginInput} />

            {errorMessge(loginError)}

            <input className   = {className("password", passwordError)}
                   type        = "password"
                   placeholder = "Password"
                   value       = {password}
                   onInput     = {onPasswordInput} />

            {errorMessge(passwordError)}

            <div className="buttons">
                <Button type="cancel" onClick={props.onCancel}>Cancel</Button>

                <Button type      = "submit"
                        makeInput = {true}
                        disabled  = {disabled}
                        onClick   = {() => props.onSignIn?.(login, password)}>
                    Sign In
                </Button>
            </div>
        </fieldset>
    </form>

    function className(base: string, error: any): string {
        return error == null ? base : base + " error"
    }

    function errorMessge(message?: string) {
        if (!message)
            return null

        return <p className="error-message">{message}</p>
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