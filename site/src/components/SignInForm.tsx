import Button  from "./Button"
import Input   from "./Input"
import Loading from "./Loading"

import { FormEvent,  useEffect, useState } from "react"
import { validateLogin, validatePassword } from "logic/auth"
import { State                           } from "./Button"

import "styles/SignInForm.css"

export type Props = {
    onSignIn?:      (login: string, password: string) => void
    onCancel?:      () => void
    onInput?:       () => void
    loginError?:    string
    passwordError?: string
    commonError?:   string
    loading?:       boolean
}

export default function SignIn(props: Props) {
    const [login,           setLogin          ] = useState("")
    const [password,        setPassword       ] = useState("")
    const [loginError,      setLoginError     ] = useState(props.loginError)
    const [passwordError,   setPasswordError  ] = useState(props.passwordError)
    const [commonError,     setCommonError    ] = useState(props.commonError)
    const [loginChanged,    setLoginChanged   ] = useState(false)
    const [passwordChanged, setPasswordChanged] = useState(false)

    useEffect(() => setLoginError(props.loginError),       [props.loginError]   )
    useEffect(() => setPasswordError(props.passwordError), [props.passwordError])
    useEffect(() => setCommonError(props.commonError),     [props.commonError]  )

    const disabled = !loginChanged
                  || !passwordChanged
                  || loginError    != null
                  || passwordError != null
                  || commonError   != null

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!disabled)
            props.onSignIn?.(login, password)
    }

    const onLoginChange = (e: FormEvent<HTMLInputElement>) => {
        const login = e.currentTarget.value
        const error = validateLogin(login)

        setLoginError(error)
        setCommonError(undefined)
        setLoginChanged(true)
        setLogin(login)
        props.onInput?.()
    }

    const onPasswordChange = (e: FormEvent<HTMLInputElement>) => {
        const password = e.currentTarget.value
        const error    = validatePassword(password)

        setPasswordError(error)
        setCommonError(undefined)
        setPasswordChanged(true)
        setPassword(password)
        props.onInput?.()
    }

    return <form className="SignInForm" onSubmit={onSubmit}>
        <fieldset> 
            <legend>Sign In</legend>

            <Input type        = "text"
                   invalid     = {loginError != null}
                   value       = {login}
                   onChange    = {onLoginChange}
                   placeholder = "Login"
                   autofocus   = {true} />

            {errorMessge(loginError)}

            <Input type        = "password"
                   invalid     = {passwordError != null}
                   value       = {password}
                   onChange    = {onPasswordChange}
                   placeholder = "Password" />

            {errorMessge(passwordError)}
            {errorMessge(commonError)}

            <div className="buttons">
                <Button type="cancel" state={cancelState()} onClick={props.onCancel}>Cancel</Button>
                <Button type="submit" state={submitState()}>Sign In</Button>
            </div>
        </fieldset>
        {props.loading ? <Loading /> : null}
    </form>

    function errorMessge(message?: string) {
        if (!message)
            return null

        return <p className="error-message">{message}</p>
    }

    function cancelState(): State {
        return props.loading ? "disabled" : "active"
    }

    function submitState(): State {
        return disabled || props.loading ? "disabled" : "active"
    }
}