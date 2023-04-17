import styles              from "./styles.module.css"

import { IconButtonProps } from "./types"

export default function IconButton(props: IconButtonProps) {
    const { onClick, children, src } = props

    return <div className={styles.button} style={{backgroundImage: `url("${src}")`}} onClick={onClick}>
        <div className={styles.children}>{children}</div>
    </div>
}