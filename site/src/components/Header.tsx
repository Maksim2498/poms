import User       from "logic/User"
import UserButton from "./UserButton"

import { State } from "./Button"

import "styles/Header.css"

export const DEFAULT_SHOW = "none"

export type Props = {
    show:         "sign-out"
    user:         User
    onSignOut?:   () => void
    buttonState?: State
} | {
    show:         "sign-in"
    onSignIn?:    () => void
    buttonState?: State
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
                return <UserButton user    = {anyProps.user}
                                   onClick = {anyProps.onSignOut}
                                   state   = {anyProps.buttonState} />

            case "sign-in":
                return <UserButton onClick = {anyProps.onSignIn}
                                   state   = {anyProps.buttonState} />
        }
    }
}