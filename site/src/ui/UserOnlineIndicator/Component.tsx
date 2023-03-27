import User from "logic/User"

import "./style.css"

export interface Props {
    user: User
}

export default function UserOnlineIndicator(props: Props) {
    const { isOnline } = props.user
    const body         = isOnline ? "online" : "offline"
    const className    = `${isOnline ? "online" : "offline"} UserOnlineIndicator`

    return <div className={className}>
        {body}
    </div>
}