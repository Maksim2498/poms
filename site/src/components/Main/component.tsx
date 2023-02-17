import "./style.css"

import AdminPanel        from "components/AdminPanel/component"
import AppearingMessage from "components/AppearingMessage/component"
import Options           from "components/Options/component"
import SignIn           from "components/SignIn/component"

export const DEFAULT_SHOW = "main"

export type Show = "welcome" | "sign-in" | "admin-panel" | "options"

export interface Props {
    show?: Show
}

export default function Main(props: Props) {
    return <main className="Main">
        {component()}
    </main>

    function component() {
        switch (props.show ?? "welcome") {
            case "welcome":
                return <AppearingMessage text="Welcome to the POMS!" />

            case "sign-in":
                return <SignIn />

            case "admin-panel":
                return <AdminPanel />

            case "options":
                return <Options />
        }
    }
}