import Logo         from "./children/Logo/Component"
import UserButton   from "./children/UserButton/Component"

import { OnSignIn } from "./children/UserButton/Component"

import "./style.css"

export type Props = UserProps
                  | NoneProps

export interface UserProps {
    show:     "user"
    onSignIn: OnSignIn
}

export interface NoneProps {
    show?: "none"
}

export type Show = "user" | "none"

export default function Header(props: Props) {
    return <header className="Header">
        <Logo />
        {show()}
    </header>

    function show() {
        switch (props.show) {
            case undefined:
            case "none":
                return <div />

            case "user":
                return <UserButton onSignIn={props.onSignIn} />
        }
    }
}