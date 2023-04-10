import User                from "logic/User"
import TaggedUserName      from "ui/TaggedUserName/Component"
import UserIcon            from "ui/UserIcon/Component"
import UserOnlineIndicator from "ui/UserOnlineIndicator/Component"
import styles              from "./styles.module.css"

export interface Props {
    onClick?: OnUserCardClick
    user:     User
}

export type OnUserCardClick = (user: User) => void

export default function UserCard(props: Props) {
    const { onClick, user } = props

    return <div className={styles.card} onClick={() => onClick?.(user)}>
        <div className={styles.icon}>
            <UserIcon user={user} />
        </div>
        <div className={styles.taggedName}>
            <TaggedUserName user={user} />
        </div>
        <div className={styles.onlineIndicator}>
            <UserOnlineIndicator user={user} />
        </div>
    </div>
}