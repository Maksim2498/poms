import styles    from "./styles.module.css"

import { Props } from "./types"

export default function List<T extends React.ReactNode>(props: Props<T>) {
    const {
        header,
        showIfEmpty,
        children: items
     } = props

    const hide = !showIfEmpty && Object.keys(items).length === 0

    if (hide)
        return null

    return <div>
        {head()}
        {body()}
    </div>

    function head() {
        if (header == null)
            return null

        const headerClassName = props.headerClassName ?? styles.header

        return <div className={headerClassName}>
            {header}
        </div>
    }

    function body() {
        const evalKey       = props.evalKey       ?? (() => Math.random())
        const listClassName = props.listClassName ?? styles.list
        const itemClassName = props.itemClassName ?? styles.item

        return <ul className={listClassName}>
            {items.map((item, i) => {
                const key = evalKey(item, i)

                return <li key={key} className={itemClassName}>
                    {item}
                </li>
            })}
        </ul>
    }
}