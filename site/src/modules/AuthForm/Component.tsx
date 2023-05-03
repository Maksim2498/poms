import User                                from "logic/User"
import LogicError                          from "logic/LogicError"
import styles                              from "./styles.module.css"

import { FormEvent, useState, useContext } from "react"
import { auth                            } from "logic/api"
import { AuthInfoContext, UserContext    } from "App"
import { Input                           } from "ui/Input"
import { Button                          } from "ui/Button"
import { FormErrorText                   } from "ui/FormErrorText"
import { AuthProps                       } from "./types"

export default function AuthFrom(props: AuthProps) {
    const { onAuth, onCancel } = props

    const contextUserRef                        = useContext(UserContext)
    const authInfoRef                           = useContext(AuthInfoContext)

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

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        setLoading(true)

        try {
            auth(authInfoRef, login, password)
            contextUserRef.current = new User({ login })
            onAuth?.()
        } catch (error) {
            if (error instanceof LogicError) {
                setCommonError(error.message)
                return
            }

            setCommonError("Internal error")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const onLoginChange = (newLogin: string) => {
        newLogin = newLogin.trim()

        const error = User.validateNormedLogin(newLogin)

        setLogin(newLogin)
        setLoginError(error)
        setLoginChanged(true)
        setCommonError(undefined)
    }

    const onPasswordChange = (newPassword: string) => {
        const error = User.validatePassword(newPassword)

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
                <Button color="red" disabled={loading} onClick={onCancel}>Cancel</Button>
                <Button color="green" disabled={signInDisabled} type="submit" loading={loading}>Sign In</Button>
            </div>
            {error(commonError)}
        </fieldset>
    </form>

    function error(message: string | undefined) {
        return message && <div className={styles.error}>
            <FormErrorText>{message}</FormErrorText>
        </div>
    }
}