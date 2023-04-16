import styles    from "./styles.module.css"

import { Props } from "./types"

export default function UserOnlineIndicator(props: Props) {
    const { isOnline } = props.user
    const body         = isOnline ? "online" : "offline"
    const className    = isOnline ? styles.online : styles.offline

    return <div className={className}>
        {body}
    </div>
}