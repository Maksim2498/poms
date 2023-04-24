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
                    image: {
                        type:      "image",
                        onCanvasCreated: onCanvasSet
                    },

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

    function onCanvasSet(canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d")

        if (context == null) {
            console.error("Canvas isn't supported")
            return
        }

        let x = Math.random() * canvas.width
        let y = Math.random() * canvas.height

        const w = 100
        const h = 100

        context.fillStyle = "red"

        const draw = () => {
            context.clearRect(0, 0, canvas.width, canvas.height)
            context.fillRect(x, y, w, h)

            x += 1
            y += 1

            if (x > canvas.width)
                x = -w

            if (y > canvas.height)
                y = -h

            requestAnimationFrame(draw)
        }

        requestAnimationFrame(draw)
    }
}