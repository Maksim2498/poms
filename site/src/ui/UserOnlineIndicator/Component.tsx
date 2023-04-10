import User   from "logic/User"
import styles from "./styles.module.css"

export interface Props {
    user: User
}

export default function UserOnlineIndicator(props: Props) {
    const { isOnline } = props.user
    const body         = isOnline ? "online" : "offline"
    const className    = isOnline ? styles.online : styles.offline

    return <div className={className}>
        {body}
    </div>
}