import User                                     from "logic/User"
import Button                                   from "ui/Button/Component"
import Dim                                      from "ui/Dim/Component"
import Loading                                  from "ui/Loading/Component"
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

    const MISSING_CONTEXT_MESSAGE = "Canvas isn't supported"
    const CORNER_SIZE             = User.MAX_ICON_SIZE / 20
    const LINE_WIDTH              = User.MAX_ICON_SIZE / 100
    const MIN_SIZE                = User.MAX_ICON_SIZE / 10

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
    const topContextRef             = useRef(undefined as CanvasRenderingContext2D | undefined)
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
                color:            "green",
                onClick:          onSave
            }
        } as Answers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iconReady])

    useEffect(() => {
        const listener = (event: ClipboardEvent) => {
            const files = event.clipboardData?.files

            if (files != null)
                onFileChange(files)
        }

        document.addEventListener("paste", listener)

        return () => document.removeEventListener("paste", listener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!changing)
            reset()
    }, [changing])

    useEffect(() => {
        if (!editMode)
            reset()
    }, [editMode])

    const className = user?.isAdmin ? styles.admin : styles.regular

    if (user?.iconLoading)
        return <div className={className}>
            <Loading />
        </div>

    return <div className={className}>
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
                            <Button onClick={() => onChange?.(user.withIcon(undefined), user)} color="red">
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
        topContextRef.current   = undefined
        insideRef.current       = false
        insideCornerRef.current = false
        resizingRef.current     = false
        oldRectRef.current      = undefined
        draggingRef.current     = false
    }

    function onSave() {
        if (!onChange || !user) {
            setChanging(false)
            return
        }

        const image  = imageRef.current
        const canvas = contextRef.current?.canvas
        const rect   = rectRef.current

        if (image == null || canvas == null || rect == null) {
            setChanging(false)
            return
        }

        const iconCanvas = document.createElement("canvas")

        const { x, y, size } = rect

        iconCanvas.width  = size
        iconCanvas.height = size

        const context = iconCanvas.getContext("2d")

        if (context == null) {
            console.error(MISSING_CONTEXT_MESSAGE)
            setChanging(false)
            return
        }

        context.drawImage(image, 0, 0, image.width, image.height, -x, -y, canvas.width, canvas.height)

        const icon = iconCanvas.toDataURL()

        onChange(user?.withIcon(icon), user)

        setChanging(false)
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
            console.error(MISSING_CONTEXT_MESSAGE)
            return 
        }

        contextRef.current = context

        const topCanvas  = document.createElement("canvas")
        const topContext = topCanvas.getContext("2d")

        if (topContext == null) {
            console.error(MISSING_CONTEXT_MESSAGE)
            return
        }

        topContextRef.current = topContext

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

        const hor    = width >= height
        const ver    = !hor
        const factor = (hor ? width : height) / User.MAX_ICON_SIZE

        width  /= factor
        height /= factor

        const { canvas } = context

        canvas.width  = width
        canvas.height = height

        // Rect update

        const size = hor ? height                : width
        const x    = hor ? width  / 2 - size / 2 : 0
        const y    = ver ? height / 2 - size / 2 : 0

        rectRef.current = { x, y, size }

        // Top canvas size update

        const topCanvas = topContextRef.current?.canvas

        if (topCanvas == null)
            return

        topCanvas.width  = width
        topCanvas.height = height
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
            newRect.x = 0

        if (newRect.y < 0)
            newRect.y = 0

        if (newRect.x + newRect.size > canvas.width)
            newRect.size = canvas.width - newRect.x

        if (newRect.y + newRect.size > canvas.height)
            newRect.size = canvas.height - newRect.y

        rectRef.current = newRect

        redraw()
    }

    function redraw() {
        const context = contextRef.current
        const image   = imageRef.current

        if (context == null || image == null)
            return

        const { canvas } = context

        // Image drawing

        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height)

        // Dimming

        const topContext = topContextRef.current
        const rect       = rectRef.current

        if (topContext == null || rect == null)
            return

        const topCanvas = topContext.canvas

        topContext.clearRect(0, 0, topCanvas.width, topCanvas.height)

        topContext.fillStyle = "rgba(0, 0, 0, 60%)"

        topContext.fillRect(0, 0, topCanvas.width, topCanvas.height)

        const { x, y, size } = rect

        topContext.clearRect(x, y, size, size)

        const updating =  draggingRef.current
                       || resizingRef.current !== false

        const style = updating ? "white"
                               : "rgba(255, 255, 255, 50%)"

        // Border drawing

        topContext.strokeStyle = style
        topContext.lineWidth   = LINE_WIDTH

        topContext.strokeRect(x, y, size, size)

        // Corners drawing

        topContext.fillStyle = style

        const cornerPoses = [
            [x,        y       ],
            [x,        y + size],
            [x + size, y       ],
            [x + size, y + size],
        ]

        const offset = CORNER_SIZE / 2

        for (const [x, y] of cornerPoses)
            topContext.fillRect(x - offset, y - offset, CORNER_SIZE, CORNER_SIZE)

        // Drawing selection

        context.drawImage(topCanvas, 0, 0)
    }
}