import User                                     from "logic/User"
import Button                                   from "ui/Button/Component"
import Dim                                      from "ui/Dim/Component"
import Modal                                    from "ui/Modal/Component"
import defaultIconSrc                           from "./default-icon.svg"
import styles                                   from "./styles.module.css"

import { useState, useEffect, useRef, useMemo } from "react"
import { UserIconProps                        } from "./types"
import { Answers                              } from "ui/Modal/types"

export default function UserIcon(props: UserIconProps) {
    type Rect = {
        x:    number
        y:    number
        size: number
    }

    const DRAGGER_SIZE = 50

    const {
        editMode,
        onClick,
        user,
        onChange
    } = props

    const [changing,  setChanging ] = useState(false)
    const [iconReady, setIconReady] = useState(false)
    const imageRef                  = useRef(undefined as HTMLImageElement         | undefined)
    const contextRef                = useRef(undefined as CanvasRenderingContext2D | undefined)
    const rectRef                   = useRef(undefined as Rect                     | undefined)
    const insideRef                 = useRef(false)
    const draggingRef               = useRef(false)
    const answers                   = useMemo(() => {
        return {
            image: iconReady && {
                onCanvasSet,
                onMouseMove,
                onMouseDown,
                onMouseUp,
                onMouseLeave,
                type:             "canvas"
            },

            file: {
                type:             "file",
                label:            "Select icon file",
                accept:           "image/*",
                onChange:         onFileChange
            },

            cancel: {
                type:             "button",
                text:             "Cancel",
                onClick:          () => setChanging(false),
                autoFocus:        true
            },

            save: {
                type:             "button",
                text:             "Save",
                color:            "green"
            }
        } as Answers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iconReady])

    useEffect(() => {
        if (!changing)
            reset()
    }, [changing])

    useEffect(() => {
        if (!editMode)
            reset()
    }, [editMode])

    return <div className={user?.isAdmin ? styles.admin : styles.regular}>
        <img className = {styles.icon}
             src       = {user?.displayIcon ?? defaultIconSrc}
             alt       = "User profile icon"
             onClick   = {() => onClick?.(user)} />

        {
            editMode && <div className={styles.editContainer}>
                <Dim>
                    <div className={styles.button}>
                        <Button onClick={() => setChanging(true)}>
                            Change
                        </Button>
                    </div>
                    {
                        user?.icon && <div className={styles.button}>
                            <Button onClick={() => onChange?.(user.withIcon(), user)} color="red">
                                Reset
                            </Button>
                        </div>
                    }
                </Dim>
            </div>
        }

        {
            changing && <Modal header="Icon Changing">
                {answers}
            </Modal>
        }
    </div>

    function reset() {
        setChanging(false)
        setIconReady(false)

        imageRef.current   = undefined
        contextRef.current = undefined
        insideRef.current  = false
    }

    function onFileChange(files: FileList | null) {
        const ready =  files != null
                    && files.length > 0

        if (!ready)
            return

        const [file] = files
        const url    = URL.createObjectURL(file)
        const image  = new Image()

        image.onload = () => {
            if (contextRef.current == null) {
                setIconReady(true) // After this onCanvasSet will be called
                return
            }

            update()
            redraw()
        }

        image.src = url

        imageRef.current = image
    }

    function onCanvasSet(canvas: HTMLCanvasElement) {
        const context = canvas.getContext("2d")

        if (context == null) {
            console.error("Canvas isn't supported")
            return 
        }

        contextRef.current = context

        update()
        redraw()
    }

    function update() {
        const context = contextRef.current
        const image   = imageRef.current

        if (context == null || image == null)
            return

        // Canvas size update

        let { width, height } = image

        const hor = width >= height
        const ver = !hor

        if (hor) {
            const factor = width / User.MAX_ICON_WIDTH

            width  /= factor
            height /= factor
        } else {
            const factor = height / User.MAX_ICON_HEIGHT

            width  /= factor
            height /= factor
        }

        const { canvas } = context

        canvas.width  = width
        canvas.height = height

        // Rect update

        const size = hor ? height                : width
        const x    = hor ? width  / 2 - size / 2 : 0
        const y    = ver ? height / 2 - size / 2 : 0

        rectRef.current = { x, y, size }
    }

    function onMouseMove(x: number, y: number, dx: number, dy: number) {
        setInside(rectContains(x, y))

        if (draggingRef.current)
            moveRect(dx, dy)
    }

    function onMouseDown(x: number, y: number) {
        if (insideRef.current)
            setDragging(true)
    }

    function onMouseUp(x: number, y: number) {
        setDragging(false)
    }

    function onMouseLeave() {
        setInside(false)
        setDragging(false)
    }

    function setInside(inside: boolean) {
        insideRef.current = inside
        updateCursor()
    }

    function setDragging(dragging: boolean) {
        draggingRef.current = dragging
        updateCursor()
    }

    function updateCursor() {
        const cursor = draggingRef.current ? "grabbing"
                                           : insideRef.current ? "grab"
                                                               : "auto"

        setCursor(cursor)
    }

    function setCursor(cursor: string) {
        const context = contextRef.current

        if (context == null)
            return

        context.canvas.style.cursor = cursor
    }

    function rectContains(x: number, y: number): boolean {
        const rect = rectRef.current

        if (rect == null)
            return false

        return x > rect.x && x < rect.x + rect.size
            && y > rect.y && y < rect.y + rect.size
    }

    function moveRect(dx: number, dy: number) {
        const canvas = contextRef.current?.canvas
        const rect   = rectRef.current

        if (rect == null || canvas == null)
            return

        rect.x += dx
        rect.y += dy

        const { x, y, size    } = rect
        const { width, height } = canvas

        if (x < 0)
            rect.x = 0
        else if (x + size > width)
            rect.x = width - size

        if (y < 0)
            rect.y = 0
        else if (y + size > height)
            rect.y = height - size

        redraw()
    }

    function redraw() {
        const context = contextRef.current
        const image   = imageRef.current

        if (context == null || image == null)
            return

        const { canvas } = context

        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)

        const rect = rectRef.current

        if (rect == null)
            return

        /*
           Rects drawing schema:

               | Third
               v

           $$  ###########  $$
           $$  ###########  $$
           $$               $$
           $$  +---------+  $$
           $$  |Selection|  $$
           $$  +---------+  $$
           $$               $$
           $$  ###########  $$
           $$  ###########  $$

           ^   ^            ^
           |   |            | Second
           |   |
           |   | Fourth
           |
           | First
        */

        const { x, y, size } = rect

        context.fillStyle = "rgba(0, 0, 0, 60%)"

        // First
        context.fillRect(0, 0, x, canvas.height)

        // Second
        context.fillRect(x + size, 0, canvas.width - x - size, canvas.height)

        // Third
        context.fillRect(x, 0, size, y)

        // Fourth
        context.fillRect(x, y + size, size, canvas.height - y - size)

        // Border drawing

        context.strokeStyle = "white"
        context.lineWidth   = 10

        context.strokeRect(x, y, size, size)

        // Corners drawing

        context.fillStyle = "white"

        const cornerPoses = [
            [x,        y       ],
            [x,        y + size],
            [x + size, y       ],
            [x + size, y + size],
        ]

        const offset = DRAGGER_SIZE / 2

        for (const [x, y] of cornerPoses)
            context.fillRect(x - offset, y - offset, DRAGGER_SIZE, DRAGGER_SIZE)
    }
}