import Logo         from "ui/Logo/Component"
import UserButton   from "components/UserButton/Component"
import styles       from "./styles.module.css"

import { Props    } from "./types"

export default function Header(props: Props) {
    return <header className={styles.header}>
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