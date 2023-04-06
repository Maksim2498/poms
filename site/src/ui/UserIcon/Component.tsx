import User           from "logic/User";
import defaultIconSrc from "./default-icon.svg"

import "./style.css"

export interface Props {
    onClick?: OnUserIconClick
    user?:    User
}

export type OnUserIconClick = (user?: User) => void

export default function UserIcon(props: Props) {
    const { onClick, user } = props
    const className         = user?.isAdmin ? "admin UserIcon"
                                            : "regular UserIcon"

    return <img className = {className}
                src       = {user?.icon ?? defaultIconSrc}
                alt       = "User profile icon"
                onClick   = {() => onClick?.(user)} />
}