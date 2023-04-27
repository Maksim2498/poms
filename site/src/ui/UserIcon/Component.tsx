import User                                     from "logic/User"
import Button                                   from "ui/Button/Component"
import Dim                                      from "ui/Dim/Component"
import Modal                                    from "ui/Modal/Component"
import defaultIconSrc                           from "./default-icon.svg"
import styles                                   from "./styles.module.css"

import { useState, useEffect, useRef, useMemo } from "react"
import { UserIconProps                        } from "./types"
import { Answers                              } from "ui/Modal/types"

/*

    Corner Numbering

    0----1
    |    |
    |    |
    3----2

*/

export default function UserIcon(props: UserIconProps) {
    type Rect = {
        x:    number
        y:    number
        size: number
    }

    type Corner = 0 | 1 | 2 | 3

    const CORNER_SIZE = 80
    const MIN_SIZE    = 100

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
    const insideCornerRef           = useRef(false     as Corner                   | false    )
    const resizingRef               = useRef(false     as Corner                   | false    )
    const oldRectRef                = useRef(undefined as Rect                     | undefined)
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
                disable:          () => imageRef.current == null,
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

        imageRef.current        = undefined
        contextRef.current      = undefined
        insideRef.current       = false
        insideCornerRef.current = false
        resizingRef.current     = false
        oldRectRef.current      = undefined
        draggingRef.current     = false
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
        const corner = cornerContains(x, y)

        setInsideCorner(corner)
        setInside(corner === false ? rectContains(x, y) : false)

        if (draggingRef.current)
            moveRect(dx, dy)
        
        if (resizingRef.current !== false)
            resizeRect(x, y, dx, dy)
    }

    function onMouseDown(x: number, y: number) {
        setDragging(insideRef.current)
        setResizing(insideCornerRef.current)
    }

    function onMouseUp(x: number, y: number) {
        setDragging(false)
        setResizing(false)
    }

    function onMouseLeave() {
        setInside(false)
        setInsideCorner(false)
        setDragging(false)
        setResizing(false)
    }

    function setInside(inside: boolean) {
        insideRef.current = inside
        updateCursor()
        redraw()
    }

    function setInsideCorner(inside: Corner | false) {
        insideCornerRef.current = inside
        updateCursor()
        redraw()
    }

    function setDragging(dragging: boolean) {
        draggingRef.current = dragging
        updateCursor()
        redraw()
    }

    function setResizing(resizing: Corner | false) {
        resizingRef.current =  resizing
        oldRectRef.current  =  resizing        !== false
                            && rectRef.current !=  null  ? { ...rectRef.current }
                                                         : undefined

        updateCursor()
        redraw()
    }

    function updateCursor() {
        setCursor(cursor())

        function cursor(): string {
            if (draggingRef.current)
                return "grabbing"

            if (resizingRef.current !== false)
                return cornerCursor(resizingRef.current)

            if (insideRef.current)
                return "grab"

            if (insideCornerRef.current !== false)
                return cornerCursor(insideCornerRef.current)

            return "auto"

            function cornerCursor(corner: Corner): string {
                switch (corner) {
                    case 1:
                    case 3:
                        return "nesw-resize"

                    case 0:
                    case 2:
                        return "nwse-resize"
                }
            }
        }
    }

    function setCursor(cursor: string) {
        const context = contextRef.current

        if (context == null)
            return

        context.canvas.style.cursor = cursor
    }

    function rectContains(x: number, y: number, rect: Rect | undefined = rectRef.current): boolean {
        if (rect == null)
            return false

        return x > rect.x && x < rect.x + rect.size
            && y > rect.y && y < rect.y + rect.size
    }

    function cornerContains(x: number, y: number, rect: Rect | undefined = rectRef.current): Corner | false {
        const rects = makeCornerRects(rect)

        for (const [i, rect] of rects.entries())
            if (rectContains(x, y, rect))
                return i as Corner

        return false
    }

    function makeCornerRects(rect: Rect | undefined = rectRef.current): Rect[] {
        if (rect == null)
            return []

        const { x, y, size } = rect

        const halfSize = CORNER_SIZE / 2

        return [
            {
                x: x        - halfSize,
                y: y        - halfSize,
                size: CORNER_SIZE,
            },
            {
                x: x + size - halfSize,
                y: y        - halfSize,
                size: CORNER_SIZE,
            },
            {
                x: x + size - halfSize,
                y: y + size - halfSize,
                size: CORNER_SIZE,
            },
            {
                x: x        - halfSize,
                y: y + size - halfSize,
                size: CORNER_SIZE,
            },
        ]
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

    function resizeRect(x: number, y: number, dx: number, dy: number) {
        const canvas  = contextRef.current?.canvas
        const rect    = rectRef.current
        const oldRect = oldRectRef.current
        const corner  = resizingRef.current

        if (rect == null || canvas == null || oldRect == null || corner === false)
            return
        
        const {
            x:    oX,
            y:    oY,
            size: oSize
        } = oldRect

        const newRect = { ...rect }

        switch (corner) {
            case 0: {
                const delta = Math.max(x - oX, y - oY)

                newRect.x    = oX    + delta
                newRect.y    = oY    + delta
                newRect.size = oSize - delta

                break
            }

            case 1: {
                const delta = Math.max(oX - x, y - oY)

                newRect.y    = oY    + delta
                newRect.size = oSize - delta

                break
            }

            case 2: {
                newRect.size = Math.max(x - rect.x, y - rect.y)
                break
            }

            case 3: {
                const delta = Math.max(x - oX, oY - y)

                newRect.x    = oX    + delta
                newRect.size = oSize - delta

                break
            }
        }

        if (newRect.size < MIN_SIZE)
            return

        if (newRect.x < 0)
            return

        if (newRect.y < 0)
            return

        if (newRect.x + newRect.size > canvas.width)
            return

        if (newRect.y + newRect.size > canvas.height)
            return

        rectRef.current = newRect

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

        const updating =  draggingRef.current
                       || resizingRef.current !== false

        const style = updating ? "white"
                               : "rgba(255, 255, 255, 50%)"

        // Border drawing

        context.strokeStyle = style
        context.lineWidth   = 10

        context.strokeRect(x, y, size, size)

        // Corners drawing

        context.fillStyle = style

        const cornerPoses = [
            [x,        y       ],
            [x,        y + size],
            [x + size, y       ],
            [x + size, y + size],
        ]

        const offset = CORNER_SIZE / 2

        for (const [x, y] of cornerPoses)
            context.fillRect(x - offset, y - offset, CORNER_SIZE, CORNER_SIZE)
    }
}