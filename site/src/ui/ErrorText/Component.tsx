import styles             from "./styles.module.css"

import { ErrorTextProps } from "./types"

export default function ErrorText(props: ErrorTextProps) {
    const { children } = props

    if (!children)
        return null

    return <div className={styles.text}>
        {body()}
    </div>

    function body() {
        if (children instanceof Error)
            return children.message

        return children
    }
}