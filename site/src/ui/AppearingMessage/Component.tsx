import styles                  from "./styles.module.css"

import { useState, useEffect } from "react"
import { Props               } from "./types"

export const DEFAULT_TICK        = 80
export const DEFAULT_DELAY       = 500
export const DEFAULT_CURSOR      = "_"
export const DEFUALT_CURSOR_TICK = 500

export default function AppearingMessage(props: Props) {
    const targetMessage = props.children   ?? ""
    const tick          = props.tick       ?? DEFAULT_TICK
    const delay         = props.delay      ?? DEFAULT_DELAY
    const cursor        = props.cursor     ?? DEFAULT_CURSOR
    const cursorTick    = props.cursorTick ?? DEFUALT_CURSOR_TICK

    const [doTick,  setDoTick ] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        const timeout = window.setTimeout(() => setDoTick(true), delay)
        return () => clearTimeout(timeout)
    }, [delay])

    useEffect(() => {
        if (!doTick)
            return

        const interval = setInterval(() => {
            if (message === targetMessage) {
                clearInterval(interval)
                return
            }

            setMessage(message + targetMessage[message.length])
        }, tick)

        return () => clearInterval(interval)
    }, [doTick, message, targetMessage, tick])

    const [showCursor, setShowCursor] = useState(false)
    const cursorStub                  = " ".repeat(cursor.length)

    useEffect(() => {
        const interval = setInterval(() => setShowCursor(!showCursor), cursorTick)
        return () => clearInterval(interval)
    }, [showCursor, cursorTick])

    return <div className={styles.message}>
        {message}{showCursor ? cursor : cursorStub}
    </div>
}