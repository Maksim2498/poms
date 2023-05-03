import { Content } from "../ContentStackContext"

export interface ContentSelectorProps {
    contentList?: Content[]
    onSelect?:    OnContentSelect
}

export type OnContentSelect = (conent: Content) => void