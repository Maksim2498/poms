import styles                  from "./styles.module.css"

import { TaggedUserName      } from "ui/TaggedUserName"
import { UserIcon            } from "ui/UserIcon"
import { UserOnlineIndicator } from "ui/UserOnlineIndicator"
import { UserCardProps       } from "./types"

export default function UserCard(props: UserCardProps) {
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