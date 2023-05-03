import styles                   from "./styles.module.css"

import { Button               } from "ui/Button"
import { ContentSelectorProps } from "./types"

export default function ContentSelector(props: ContentSelectorProps) {
    const contentList = props.contentList ?? []

    return <ul className={styles.selector}>
        {
            contentList.map((c, i) => {
                const name    = c.selectName ?? c.name
                const onClick = () => props.onSelect?.(c)

                return <li className={styles.content} key={`${name}-${i}`}>
                    <Button onClick={onClick}>{name}</Button>
                </li>
            })
        }
    </ul>
}