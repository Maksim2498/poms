import Button      from "ui/Button/Component"
import styles      from "./styles.module.css"

import { Content } from "modules/Main/children/ContentViewer/content"

export interface Props {
    contentList?: Content[]
    onSelect?:    OnContentSelect
}

export type OnContentSelect = (conent: Content) => void

export default function ContentSelector(props: Props) {
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