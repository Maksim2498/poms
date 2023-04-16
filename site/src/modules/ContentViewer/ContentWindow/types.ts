import { Content } from "modules/ContentViewer/types"

export interface Props {
    showBack?: boolean
    onBack?:   OnButtonClick
    showEdit?: boolean
    onEdit?:   OnButtonClick
    content:   Content
}

export type OnButtonClick = () => void