import User                                     from "logic/User"
import DimButton                                from "ui/DimButton/Component"
import Modal                                    from "ui/Modal/Component"
import defaultIconSrc                           from "./default-icon.svg"
import styles                                   from "./styles.module.css"

import { useState, useEffect, useRef, useMemo } from "react"
import { UserIconProps                        } from "./types"
import { Answers                              } from "ui/Modal/types"

export default function UserIcon(props: UserIconProps) {
    const {
        editMode,
        onClick,
        user,
        onChange
    } = props

    const [changing,  setChanging ] = useState(false)
    const [iconReady, setIconReady] = useState(false)
    const canvasRef                 = useRef(undefined as HTMLCanvasElement | undefined)
    const fileRef                   = useRef(undefined as File              | undefined)
    const answers                   = useMemo(() => {
        return {
            image: iconReady && {
                type:            "canvas",
                onCanvasSet: onCanvasCreated
            },

            file: {
                type:            "file",
                label:           "Select icon file",
                accept:          "image/*",
                onChange:        onFileChange
            },

            cancel: {
                type:            "button",
                text:            "Cancel",
                onClick:         () => setChanging(false),
                autoFocus:       true
            },

            save: {
                type:            "button",
                text:            "Save",
                color:           "green"
            }
        } as Answers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iconReady])

    useEffect(() => {
        if (changing)
            return

        setIconReady(false)
    }, [changing])

    useEffect(() => {
        if (editMode)
            return

        setChanging(false)
        setIconReady(false)
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
                {answers}
            </Modal>
        }
    </div>

    function onFileChange(files: FileList | null) {
        const ready =  files != null
                    && files.length > 0

        if (!ready)
            return

        fileRef.current = files[0]

        setIconReady(true)
    }

    function onCanvasCreated(canvas: HTMLCanvasElement) {
        canvasRef.current = canvas
        drawFile()
    }

    function drawFile() {
        const file = fileRef.current

        if (file == null)
            return

        const url   = URL.createObjectURL(file)
        const image = new Image()

        image.onload = () => drawImage(image)
        image.src    = url
    }

    function drawImage(image: HTMLImageElement) {
        const canvas = canvasRef.current

        if (canvas == null)
            return

        let { width, height } = image

        if (width > User.MAX_ICON_WIDTH) {
            const factor = width / User.MAX_ICON_WIDTH

            width  /= factor
            height /= factor
        }

        if (height > User.MAX_ICON_HEIGHT) {
            const factor = height / User.MAX_ICON_HEIGHT

            width  /= factor
            height /= factor
        }

        canvas.width  = width
        canvas.height = height

        const context = canvas.getContext("2d")

        if (context == null) {
            console.error("Canvas isn't supported")
            return 
        }

        context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)
    }
}