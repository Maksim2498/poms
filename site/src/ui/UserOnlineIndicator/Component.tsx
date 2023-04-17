import styles                       from "./styles.module.css"

import { UserOnlineIndicatorProps } from "./types"

export default function UserOnlineIndicator(props: UserOnlineIndicatorProps) {
    const { isOnline } = props.user
    const body         = isOnline ? "online" : "offline"
    const className    = isOnline ? styles.online : styles.offline

    return <div className={className}>
        {body}
    </div>
}