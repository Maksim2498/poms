import User   from "logic/User";
import styles from "./styles.module.css"

export interface Props {
    user: User
}

export default function UserName(props: Props) {
    const { name, login } = props.user
    return <span className={styles.name}>{name ?? login}</span>
}