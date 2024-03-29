import styles                  from "./styles.module.css"

import { useEffect, useState } from "react"
import { Button              } from "ui/Button"
import { BackButton          } from "ui/BackButton"
import { EditButton          } from "ui/EditButton"
import { ContentWindowProps  } from "./types"

export default function ContentWindow(props: ContentWindowProps) {
    const {
        showBack,
        onBack,
        showEdit,
        onEdit,
        content
    } = props

    const [editMode, setEditMode] = useState(false)

    useEffect(exitEditMode, [content, showEdit])

    return <div className={styles.window}>
        <div className={styles.header}>
            <div className={styles.leftButton}>
                {showBack && <BackButton onClick={onBack} />}
            </div>

            {content && <h2 className={styles.title}>{content.name}</h2>}

            <div className={styles.rightButton}>
                {editMode ? <Button onClick={exitEditMode}>Done</Button>
                          : showEdit && <EditButton onClick={innerOnEdit} />}
            </div>
        </div>

        <div className={styles.main}>
            {content && <content.component editMode={editMode}/>}
        </div>
    </div>

    function exitEditMode() {
        setEditMode(false)
    }

    function innerOnEdit() {
        onEdit?.()
        setEditMode(true)
    }
}