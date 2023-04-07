import User   from "logic/User";
import styles from "./styles.module.css"

export type Props = UserProps
                  | LoginProps

export interface UserProps {
    onClick?: OnUserTagClick
    user:     User
}

export interface LoginProps {
    onClick?: OnUserTagClick
    login:    string
}

export type OnUserTagClick = (login: string) => void

export default function UserTag(props: Props) {
    const { onClick } = props
    const login       = getLogin()

    return <div className={styles.UserTag} onClick={() => onClick?.(login)}>
        @{login}
    </div>

    function getLogin(): string {
        return "login" in props ? props.login
                                : props.user.login
    }
}