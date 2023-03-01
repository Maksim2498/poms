import Greeting  from "./Greeting"
import SignIn    from "./SignIn"
import UserPanel from "./UserPanel"

import "styles/Main.css"

export const DEFAULT_SHOW = "greeting"

export type Props = {
    show?: "greeting" | "user-panel"
} | {
    show:      "sign-in"
    onSignIn?: (login: string, password: string) => void
    onCancel?: () => void
}

export type Show = "greeting" | "sign-in" | "user-panel"

export default function Main(props: Props) {
    return <main className="Main">
        {content()}
    </main>

    function content() {
        const anyProps = props as any

        switch (props.show ?? DEFAULT_SHOW) {
            case "greeting":
                return <Greeting />

            case "sign-in":
                return <SignIn onSignIn={anyProps.onSignIn} onCancel={anyProps.onCancel} />

            case "user-panel":
                return <UserPanel isAdmin={true} />
        }
    }
}