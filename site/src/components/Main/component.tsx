import "./style.css"

import AdminPanel        from "components/AdminPanel/component"
import AppearingMessage from "components/AppearingMessage/component"
import Options           from "components/Options/component"
import SignIn           from "components/SignIn/component"

export const DEFAULT_SHOW = "none"

export type Props = {
    show?: "none" | "sign-in" | "admin-panel" | "options"
} | {
    show:   "welcome"
    login?: string
}

export default function Main(props: Props) {
    return <main className="Main">
        {component()}
    </main>

    function component() {
        switch (props.show ?? DEFAULT_SHOW) {
            case "none":
                return null

            case "welcome":
                const login = (props as any).login
                const text  = login != null ? `Welcome to the POMS, ${login}!` 
                                            : "Welcome to the POMS!"

                return <AppearingMessage text={text} />

            case "sign-in":
                return <SignIn />

            case "admin-panel":
                return <AdminPanel />

            case "options":
                return <Options />
        }
    }
}