import Button from "ui/Button/Component"

import "./style.css"

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

    return <ul className="ContentSelector">
        {
            contentList.map((c, i) => {
                const name    = c.selectName ?? c.name
                const onClick = () => props.onSelect?.(c)

                return <li className="content" key={`${name}-${i}`}>
                    <Button onClick={onClick}>{name}</Button>
                </li>
            })
        }
    </ul>
}