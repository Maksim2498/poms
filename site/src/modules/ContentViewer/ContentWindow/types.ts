import { Content } from "../ContentStackContext"

export interface ContentWindowProps {
    showBack?: boolean
    onBack?:   OnButtonClick
    showEdit?: boolean
    onEdit?:   OnButtonClick
    content?:  Content
}

export type OnButtonClick = () => void