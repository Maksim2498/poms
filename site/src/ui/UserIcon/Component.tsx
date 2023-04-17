import defaultIconSrc    from "./default-icon.svg"
import styles            from "./styles.module.css"

import { UserIconProps } from "./types"

export default function UserIcon(props: UserIconProps) {
    const { onClick, user } = props
    const className         = user?.isAdmin ? styles.admin : styles.regular
    const src               = user?.icon ?? defaultIconSrc
    const rawOnClick        = () => onClick?.(user)

    return <img className = {className}
                src       = {src}
                alt       = "User profile icon"
                onClick   = {rawOnClick} />
}