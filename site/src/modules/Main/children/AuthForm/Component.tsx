import ApiManager                          from "logic/ApiManager"
import User                                from "logic/User"
import LogicError                          from "logic/LogicError"
import Input                               from "ui/Input/Component"
import Button                              from "ui/Button/Component"
import ErrorText                           from "ui/ErrorText/Component"

import { FormEvent, useState, useContext } from "react"
import { UserContext                     } from "pages/App/Component"

import "./style.css"

export interface Props {
    onAuth?:   OnAuth
    onCancel?: OnCancelAuth
}

export type OnAuth       = () => void
export type OnCancelAuth = () => void

export default function AuthFrom(props: Props) {
    const { onAuth, onCancel } = props

    const [,                setUser           ] = useContext(UserContext)

    const [login,           setLogin          ] = useState("")
    const [password,        setPassword       ] = useState("")

    const [loginError,      setLoginError     ] = useState(null as string | null)
    const [passwordError,   setPasswordError  ] = useState(null as string | null)
    const [commonError,     setCommonError    ] = useState(null as string | null)

    const [loginChanged,    setLoginChanged   ] = useState(false)
    const [passwordChanged, setPasswordChanged] = useState(false)

    const [loading,         setLoading        ] = useState(false)

    const bothChanged      =  loginChanged
                           && passwordChanged

    const loginInvalid     = loginError    != null
    const passwordInvalid  = passwordError != null
    const somethingInvalid = commonError   != null

    const hasError         =  loginInvalid
                           || passwordInvalid
                           || somethingInvalid

    const signInDisabled   = !bothChanged
                           || hasError

    const cancelState      = loading  ? "disabled"
                                      : "active"

    const signInState      =  loading ? "loading"
                                      : signInDisabled ? "disabled"
                                                       : "active"

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        setLoading(true)

        const apiManager = ApiManager.instance

        apiManager.auth(login, password)
            .then(() => {
                setUser(apiManager.user)
                onAuth?.()
            })
            .catch(error => {
                if (error instanceof LogicError) {
                    setCommonError(error.message)
                    return
                }

                setCommonError("Internal error")
                console.error(error)
            })
            .finally(() => setLoading(false))
    }

    const onLoginChange = (e: FormEvent<HTMLInputElement>) => {
        const login = e.currentTarget.value
        const error = formatError(User.validateLogin(login))

        setLogin(login)
        setLoginError(error)
        setLoginChanged(true)
        setCommonError(null)
    }

    const onPasswordChange = (e: FormEvent<HTMLInputElement>) => {
        const password = e.currentTarget.value
        const error    = formatError(User.validatePassword(password))

        setPassword(password)
        setPasswordError(error)
        setPasswordChanged(true)
        setCommonError(null)
    }

    return <form className="AuthForm" onSubmit={onSubmit}>
        <fieldset>
            <legend>Sign In</legend>
            <Input placeholder="Login" onChange={onLoginChange} invalid={loginInvalid} />
            <ErrorText>{loginError}</ErrorText>
            <Input placeholder="Password" onChange={onPasswordChange} invalid={passwordInvalid} type="password" />
            <ErrorText>{passwordError}</ErrorText>
            <div className="buttons">
                <Button type="cancel" state={cancelState} onClick={onCancel}>Cancel</Button>
                <Button type="submit" state={signInState}>Sign In</Button>
            </div>
            <ErrorText>{commonError}</ErrorText>
        </fieldset>
    </form>

    function formatError(error: string | null): string | null {
        return error?.replaceAll(/\.\s*/g, ".\n")
                    ?.replaceAll(/\.?$/g,  ".") ?? null
    }
}