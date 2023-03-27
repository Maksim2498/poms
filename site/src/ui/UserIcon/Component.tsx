import User           from "logic/User";
import defaultIconSrc from "./default-icon.svg"

import "./style.css"

export interface Props {
    user: User
}

export default function UserIcon(props: Props) {
    const { user }  = props
    const className = user.isAdmin ? "admin UserIcon" : "UserIcon"

    return <img className={className} src={defaultIconSrc} alt="User profile icon" />
}