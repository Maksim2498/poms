import User                from "logic/User"
import TaggedUserName      from "ui/TaggedUserName/Component"
import UserIcon            from "ui/UserIcon/Component"
import UserOnlineIndicator from "ui/UserOnlineIndicator/Component"

import "./style.css"

export interface Props {
    onClick?: OnUserCardClick
    user:     User
}

export type OnUserCardClick = (user: User) => void

export default function UserCard(props: Props) {
    const { onClick, user } = props

    return <div className="UserCard" onClick={() => onClick?.(user)}>
        <UserIcon            user={user} />
        <TaggedUserName      user={user} />
        <UserOnlineIndicator user={user} />
    </div>
}