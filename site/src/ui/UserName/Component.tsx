import styles    from "./styles.module.css"

import { Props } from "./types"

export default function UserName(props: Props) {
    const { name, login } = props.user
    return <span className={styles.name}>{name ?? login}</span>
}