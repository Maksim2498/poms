import User           from "logic/User";
import defaultIconSrc from "./default-icon.svg"
import styles         from "./styles.module.css"

export interface Props {
    onClick?: OnUserIconClick
    user?:    User
}

export type OnUserIconClick = (user?: User) => void

export default function UserIcon(props: Props) {
    const { onClick, user } = props
    const className         = user?.isAdmin ? styles.admin : styles.regular
    const src               = user?.icon ?? defaultIconSrc
    const rawOnClick        = () => onClick?.(user)

    return <img className = {className}
                src       = {src}
                alt       = "User profile icon"
                onClick   = {rawOnClick} />
}