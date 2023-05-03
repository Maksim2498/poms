import styles          from "./styles.module.css"

import { Logo        } from "./Logo"
import { UserButton  } from "./UserButton"
import { HeaderProps } from "./types"

export default function Header(props: HeaderProps) {
    return <header className={styles.header}>
        <Logo />
        {right()}
    </header>

    function right() {
        switch (props.show) {
            case undefined:
            case "none":
                return <div />

            case "user":
                return <UserButton onSignIn={props.onSignIn} />
        }
    }
}