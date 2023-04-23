import DimButton               from "ui/DimButton/Component"
import Modal                   from "ui/Modal/Component"
import defaultIconSrc          from "./default-icon.svg"
import styles                  from "./styles.module.css"

import { useState, useEffect } from "react"
import { UserIconProps       } from "./types"

export default function UserIcon(props: UserIconProps) {
    const {
        editMode,
        onClick,
        user,
        onChange
    } = props

    const [changing, setChanging] = useState(false)

    useEffect(() => {
        if (!editMode)
            setChanging(false)
    }, [editMode])

    return <div className={user?.isAdmin ? styles.admin : styles.regular}>
        <img className = {styles.icon}
             src       = {user?.icon ?? defaultIconSrc}
             alt       = "User profile icon"
             onClick   = {() => onClick?.(user)} />

        {
            editMode && <div className={styles.editContainer}>
                <DimButton onClick={() => setChanging(true)}>Change</DimButton>
            </div>
        }

        {
            changing && <Modal header="Icon Changing">
                {{
                    cancel: {
                        type:      "button",
                        text:      "Cancel",
                        onClick:   () => setChanging(false),
                        autoFocus: true
                    },

                    save: {
                        type:      "button",
                        text:      "Save",
                        color:     "green"
                    }
                }}
            </Modal>
        }
    </div>
}