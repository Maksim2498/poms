import User       from "logic/User"
import Greeting   from "./Greeting"
import SignInForm from "./SignInForm"
import UserPanel  from "./UserPanel"
import Loading    from "./Loading"

import "styles/Main.css"

export const DEFAULT_SHOW = "loading"

export type Props = {
    show?: "greeting" | "loading"
} | {
    show: "user-panel"
    user: User
} | {
    show:           "sign-in"
    onSignIn?:      (login: string, password: string) => void
    onCancel?:      () => void
    loginError?:    string
    passwordError?: string
    commonError?:   string
    loading?:       boolean
}

export type Show = "loading" | "greeting" | "sign-in" | "user-panel"

export default function Main(props: Props) {
    return <main className="Main">
        {content()}
    </main>

    function content() {
        const anyProps = props as any

        switch (props.show ?? DEFAULT_SHOW) {
            case "greeting":
                return <Greeting />
            
            case "loading":
                    return <Loading />

            case "sign-in":
                return <SignInForm onSignIn      = {anyProps.onSignIn}
                                   onCancel      = {anyProps.onCancel}
                                   loginError    = {anyProps.loginError}
                                   passwordError = {anyProps.passwordError}
                                   commonError   = {anyProps.commonError}
                                   loading       = {anyProps.loading} />

            case "user-panel":
                return <UserPanel user={anyProps.user} />
        }
    }
}