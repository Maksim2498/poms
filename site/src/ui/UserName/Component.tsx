import styles            from "./styles.module.css"

import { UserNameProps } from "./types"

export default function UserName(props: UserNameProps) {
    const { name, login } = props.user
    return <span className={styles.name}>{name ?? login}</span>
}