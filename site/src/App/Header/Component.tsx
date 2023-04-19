import Logo            from "ui/Logo/Component"
import UserButton      from "components/UserButton/Component"
import styles          from "./styles.module.css"

import { HeaderProps } from "./types"

export default function Header(props: HeaderProps) {
    return <header className={styles.header}>
        <Logo onClick={props.onLogoClick} />
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