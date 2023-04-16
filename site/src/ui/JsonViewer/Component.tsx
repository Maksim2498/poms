import styles    from "./styles.module.css"

import { Props } from "./types"

export default function JsonViewer(props: Props) {
    const json = props.json ?? {}
    const text = JSON.stringify(json, null, 4)

    return <pre className={styles.json}>
        {text}
    </pre>
}