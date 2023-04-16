import { Content } from "modules/ContentViewer/types"

export interface Props {
    contentList?: Content[]
    onSelect?:    OnContentSelect
}

export type OnContentSelect = (conent: Content) => void