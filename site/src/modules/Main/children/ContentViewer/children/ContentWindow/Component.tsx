import BackButton  from "ui/BackButton/Component"
import EditButton  from "ui/EditButton/Component"

import { OnClick } from "ui/Button/Component"
import { Content } from "../ContentSelector/Component"

import "./style.css"

export interface Props {
    showBack?: boolean
    onBack?:   OnClick
    showEdit?: boolean
    onEdit?:   OnClick
    content:   Content
}

export default function ContentWindow(props: Props) {
    const { showBack, onBack, showEdit, onEdit, content } = props

    return <div className="ContentWindow">
        <div className="header">
            {showBack ? <BackButton onClick={onBack} /> : <div />}
            <h2>{content.name}</h2>
            {showEdit ? <EditButton onClick={onEdit} /> : <div />}
        </div>
        <div className="main">
            <content.component />
        </div>
    </div>
}