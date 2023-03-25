import AuthInfo      from "logic/AuthInfo"
import User          from "logic/User"
import Input         from "ui/Input/Component"
import Button        from "ui/Button/Component"
import Error         from "ui/Error/Component"

import { FormEvent, useState } from "react"

import "./style.css"

export interface Props {
    onAuth?:   OnAuth
    onCancel?: OnCancelAuth
}

export type OnAuth       = (authInfo: AuthInfo) => void
export type OnCancelAuth = () => void

export default function AuthFrom(props: Props) {
    const { onAuth, onCancel } = props

    const [login,           setLogin          ] = useState("")
    const [password,        setPassword       ] = useState("")

    const [loginError,      setLoginError     ] = useState(null as string | null)
    const [passwordError,   setPasswordError  ] = useState(null as string | null)
    const [commonError,     setCommonError    ] = useState(null as string | null)

    const [loginChanged,    setLoginChanged   ] = useState(false)
    const [passwordChanged, setPasswordChanged] = useState(false)

    const bothChanged     =  loginChanged
                          && passwordChanged

    const loginInvalid    = loginError  != null
    const passwordInvalid = loginError  != null
    const allInvalid      = commonError != null

    const hasError        =  loginInvalid
                          || passwordInvalid
                          || allInvalid

    const disabled        = !bothChanged
                          || hasError

    const state           =  disabled ? "disabled" : "active"

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
    }

    const onLoginChange = (e: FormEvent<HTMLInputElement>) => {
        const login = e.currentTarget.value
        const error = formatError(User.validateLogin(login))

        setLogin(login)
        setLoginError(error)
        setLoginChanged(true)
    }

    const onPasswordChange = (e: FormEvent<HTMLInputElement>) => {
        const password = e.currentTarget.value
        const error    = formatError(User.validatePassword(password))

        setPassword(password)
        setPasswordError(error)
        setPasswordChanged(true)
    }

    return <form className="AuthForm" onSubmit={onSubmit}>
        <fieldset>
            <legend>Sign In</legend>
            <Input placeholder="Login" onChange={onLoginChange} invalid={loginInvalid} />
            <Error>{loginError}</Error>
            <Input placeholder="Password" onChange={onPasswordChange} invalid={passwordInvalid} type="password" />
            <Error>{passwordError}</Error>
            <div className="buttons">
                <Button type="cancel" onClick={onCancel}>Cancel</Button>
                <Button type="submit" state={state}>Sign In</Button>
            </div>
            <Error>{commonError}</Error>
        </fieldset>
    </form>

    function formatError(error: string | null): string | null {
        return error?.replaceAll(/\.\s*/g, ".\n")
                    ?.replaceAll(/\.?$/g, ".") ?? null
    }
}