import styles    from "./styles.module.css"

import { Props } from "./types"

export default function UserTag(props: Props) {
    const login = getLogin()

    return <div className={styles.tag} onClick={rawOnClick}>
        @{login}
    </div>

    function getLogin(): string {
        return "login" in props ? props.login
                                : props.user.login
    }

    function rawOnClick() {
        props.onClick?.(login)
    }
}