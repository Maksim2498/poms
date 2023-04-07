import styles from "./styles.module.css"

export interface Props {
    json?: any
}

export default function JsonViewer(props: Props) {
    const json = props.json ?? {}
    const text = JSON.stringify(json, null, 4)

    return <pre className={styles.JsonViewer}>
        {text}
    </pre>
}