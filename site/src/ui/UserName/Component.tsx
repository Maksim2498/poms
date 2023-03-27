import User from "logic/User";

import "./style.css"

export interface Props {
    user: User
}

export default function UserName(props: Props) {
    const { user } = props

    return <div className="UserName">
        {user.name ?? user.login}
    </div>
}