import styles              from "./styles.module.css"

import { JsonViewerProps } from "./types"

export default function JsonViewer(props: JsonViewerProps) {
    const json = props.json ?? {}
    const text = JSON.stringify(json, null, 4)

    return <pre className={styles.json}>
        {text}
    </pre>
}