import "./style.css"

import AdminPanel from "components/AdminPanel/component"
import Greeting   from "components/Greeting/component"
import Options    from "components/Options/component"
import SignIn     from "components/SignIn/component"

export const DEFAULT_SHOW = "none"

export type Props = {
    show?: "none" | "sign-in" | "admin-panel" | "options"
} | {
    show:  "welcome"
    name?: string
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
                return <Greeting name={(props as any).name} />

            case "sign-in":
                return <SignIn />

            case "admin-panel":
                return <AdminPanel />

            case "options":
                return <Options />
        }
    }
}