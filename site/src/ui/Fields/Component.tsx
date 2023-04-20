import styles          from "./styles.module.css"

import { FieldsProps } from "./types"

export default function Fields(props: FieldsProps) {
    const {
        header,
        showIfEmpty,
        children: rows
    } = props

    const hide =  !showIfEmpty
               && Object.keys(rows).length === 0

    if (hide)
        return null

    return <div className={styles.container}>
        <table>
            {caption()}
            {body()}
        </table>
    </div>

    function caption() {
        if (header == null)
            return null

        return <caption className={styles.header}>
            {header}
        </caption>
    }

    function body() {
        const elements = [] as JSX.Element[]

        for (const label in rows) {
            const value   = rows[label]
            const key     = `${label}: ${value}`
            const element = <tr key={key} className={styles.field}>
                <td className={styles.item}>{label}: </td>
                <td className={`${styles.value} ${styles.item}`}>{value}</td>
            </tr>

            elements.push(element)
        }

        return <tbody>
            {elements}
        </tbody>
    }
}