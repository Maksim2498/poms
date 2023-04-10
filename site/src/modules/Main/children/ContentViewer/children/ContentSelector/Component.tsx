import Button from "ui/Button/Component"
import styles from "./styles.module.css"

export interface Props {
    contentList?: Content[]
    onSelect?:    OnSelect
}

export interface Content {
    name:        string
    selectName?: string
    component:   ContentComponent
}

export type OnSelect         = (conent: Content) => void
export type ContentComponent = () => JSX.Element

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