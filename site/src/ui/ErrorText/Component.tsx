import styles from "./styles.module.css"

export interface Props {
    children?: any
}

export default function ErrorText(props: Props) {
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