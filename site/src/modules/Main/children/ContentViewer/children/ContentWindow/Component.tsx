import BackButton        from "ui/BackButton/Component"
import EditButton        from "ui/EditButton/Component"
import styles            from "./styles.module.css"

import { OnButtonClick } from "ui/Button/Component"
import { Content       } from "modules/Main/children/ContentViewer/content"

export interface Props {
    showBack?: boolean
    onBack?:   OnButtonClick
    showEdit?: boolean
    onEdit?:   OnButtonClick
    content:   Content
}

export default function ContentWindow(props: Props) {
    const { showBack, onBack, showEdit, onEdit, content } = props

    return <div className={styles.window}>
        <div className={styles.header}>
            <div className={styles.button}>
                {showBack && <BackButton onClick={onBack} />}
            </div>
            <h2>{content.name}</h2>
            <div className={styles.button}>
                {showEdit && <EditButton onClick={onEdit} />}
            </div>
        </div>
        <div className={styles.main}>
            <content.component />
        </div>
    </div>
}