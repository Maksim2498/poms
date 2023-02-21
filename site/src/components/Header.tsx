import User from "./User"

import "styles/Header.css"

export const DEFAULT_SHOW = "none"

export type Props = {
    show:       "sign-out"
    name:       string
    onSignOut?: () => void
} | {
    show:      "sign-in"
    onSignIn?: () => void
} | {
    show?: "none"
}

export type Show = "sign-out" | "sign-in" | "none"

export default function Header(props: Props) {
    return <header className="Header">
        <div className="left">
            <h1>POMS</h1>
        </div>
        <div className="right">
            {right()}
        </div>
    </header>

    function right() {
        const anyProps = props as any

        switch (props.show ?? DEFAULT_SHOW) {
            case "none":
                return null

            case "sign-out":
                return <User name={anyProps.name} onSignOut={anyProps.onSignOut} />

            case "sign-in":
                return <User onSignIn={anyProps.onSignIn} />
        }
    }
}