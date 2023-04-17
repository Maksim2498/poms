import { Content } from "modules/ContentViewer/types"

export interface ContentSelectorProps {
    contentList?: Content[]
    onSelect?:    OnContentSelect
}

export type OnContentSelect = (conent: Content) => void