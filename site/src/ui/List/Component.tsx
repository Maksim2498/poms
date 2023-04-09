import styles from "./styles.module.css"

export interface Props {
    showIfEmpty?: boolean
    header?:      string
    children:     any[]
}

export default function List(props: Props) {
    const {
        header,
        showIfEmpty,
        children: items
    } = props

    const hide =  !showIfEmpty
               && Object.keys(items).length === 0

    if (hide)
        return null

    const now = (new Date()).toISOString()

    return <div>
        {head()}
        {body()}
    </div>

    function head() {
        if (header == null)
            return null

        return <div className={styles.header}>
            {header}
        </div>
    }

    function body() {
        return <ul className={styles.list}>
            {items.map((item, i) => {
                const key = `${i}/${now}`

                return <li key={key} className={styles.item}>
                    {item}
                </li>
            })}
        </ul>
    }
}