import User                                   from "logic/User"
import LogicError                             from "logic/LogicError"
import Input                                  from "ui/Input/Component"
import Button                                 from "ui/Button/Component"
import ErrorText                              from "ui/ErrorText/Component"
import styles                                 from "./styles.module.css"

import { FormEvent, useState, useContext    } from "react"
import { AuthControllerContext, UserContext } from "pages/App/Component"
import { auth                               } from "logic/api"

export interface Props {
    onAuth?:   OnAuth
    onCancel?: OnCancelAuth
}

export type OnAuth       = () => void
export type OnCancelAuth = () => void

export default function AuthFrom(props: Props) {
    const { onAuth, onCancel } = props

    const [,                setUser           ] = useContext(UserContext)
    const authController                        = useContext(AuthControllerContext)

    const [login,           setLogin          ] = useState("")
    const [password,        setPassword       ] = useState("")

    const [loginError,      setLoginError     ] = useState(undefined as string | undefined)
    const [passwordError,   setPasswordError  ] = useState(undefined as string | undefined)
    const [commonError,     setCommonError    ] = useState(undefined as string | undefined)

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

        auth(authController, login, password)
            .then(tokenPair => {
                setUser(new User({ login }))
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

    const onLoginChange = (newLogin: string) => {
        const error = formatError(User.validateLogin(newLogin))

        setLogin(newLogin)
        setLoginError(error)
        setLoginChanged(true)
        setCommonError(undefined)
    }

    const onPasswordChange = (newPassword: string) => {
        const error = formatError(User.validatePassword(newPassword))

        setPassword(newPassword)
        setPasswordError(error)
        setPasswordChanged(true)
        setCommonError(undefined)
    }

    return <form onSubmit={onSubmit}>
        <fieldset className={styles.fields}>
            <legend className={styles.header}>Sign In</legend>
            <Input placeholder="Login" onChange={onLoginChange} invalid={loginInvalid} />
            {error(loginError)}
            <Input placeholder="Password" onChange={onPasswordChange} invalid={passwordInvalid} type="password" />
            {error(passwordError)}
            <div className={styles.buttons}>
                <Button type="cancel" state={cancelState} onClick={onCancel}>Cancel</Button>
                <Button type="submit" state={signInState}>Sign In</Button>
            </div>
            {error(commonError)}
        </fieldset>
    </form>

    function error(message: string | undefined) {
        if (message == null)
            return null

        return <div className={styles.error}>
            <ErrorText>{message}</ErrorText>
        </div>
    }

    function formatError(error?: string): string | undefined {
        return error?.replaceAll(/\.\s*/g, ".\n")
                    ?.replaceAll(/\.?$/g,  ".")
    }
}