import styles           from "./styles.module.css"

import { UserTagProps } from "./types"

export default function UserTag(props: UserTagProps) {
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