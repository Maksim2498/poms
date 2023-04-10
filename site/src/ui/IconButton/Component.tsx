import styles from "./styles.module.css"

export interface Props {
    onClick?:  OnIconButtonClick
    children?: string
    src:       string
}

export type OnIconButtonClick = () => void

export default function IconButton(props: Props) {
    const { onClick, children, src } = props

    return <div className={styles.button} style={{backgroundImage: `url("${src}")`}} onClick={onClick}>
        <div className={styles.children}>{children}</div>
    </div>
}