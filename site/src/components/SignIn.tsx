import Button from "./Button"
import Input  from "./Input"

import { FormEvent, useState } from "react"

import "styles/SignIn.css"

export type Props = {
    onSignIn?: (login: string, password: string) => void
    onCancel?: () => void
}

export default function SignIn(props: Props) {
    const [login,           setLogin           ] = useState("")
    const [password,        setPassword        ] = useState("")
    const [loginError,      setLoginError      ] = useState(undefined as undefined | string)
    const [passwordError,   setPasswordError   ] = useState(undefined as undefined | string)
    const [loginChanged,    setLoginChanged    ] = useState(false)
    const [passwordChanged, setPasswordChanged ] = useState(false)

    const disabled = !loginChanged
                  || !passwordChanged
                  || loginError    != null
                  || passwordError != null

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!disabled)
            props.onSignIn?.(login, password)
    }

    const onLoginChange = (e: FormEvent<HTMLInputElement>) => {
        const login = e.currentTarget.value
        const error = validateLogin(login)

        setLoginError(error)
        setLoginChanged(true)
        setLogin(login)
    }

    const onPasswordChange = (e: FormEvent<HTMLInputElement>) => {
        const password = e.currentTarget.value
        const error    = validatePassword(password)

        setPasswordError(error)
        setPasswordChanged(true)
        setPassword(password)
    }

    return <form className="SignIn" onSubmit={onSubmit}>
        <fieldset> 
            <legend>Sign In</legend>

            <Input type        = "text"
                   invalid     = {loginError != null}
                   value       = {login}
                   onChange    = {onLoginChange}
                   placeholder = "Login" />

            {errorMessge(loginError)}

            <Input type        = "password"
                   invalid     = {passwordError != null}
                   value       = {password}
                   onChange    = {onPasswordChange}
                   placeholder = "Password" />

            {errorMessge(passwordError)}

            <div className="buttons">
                <Button type="cancel" onClick={props.onCancel}>Cancel</Button>
                <Button type="submit" disabled={disabled}>Sign In</Button>
            </div>
        </fieldset>
    </form>

    function errorMessge(message?: string) {
        if (!message)
            return null

        return <p className="error-message">{message}</p>
    }

    function validateLogin(login: string): string | undefined {
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

    function validatePassword(password: string): string | undefined {
        const MIN_LENGTH = 4

        if (password.length < MIN_LENGTH)
            return `Password must be at least ${MIN_LENGTH} characters long`

        const MAX_LENGTH = 255

        if (password.length > MAX_LENGTH)
            return `Password must not be longer than ${MAX_LENGTH} characters`

        return undefined
    }
}