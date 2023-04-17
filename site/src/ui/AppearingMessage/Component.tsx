import styles                    from "./styles.module.css"
import * as constants            from "./constants"

import { useState, useEffect   } from "react"
import { AppearingMessageProps } from "./types"

export default function AppearingMessage(props: AppearingMessageProps) {
    const targetMessage = props.children   ?? ""
    const tick          = props.tick       ?? constants.DEFAULT_APPEARING_MESSAGE_TICK
    const delay         = props.delay      ?? constants.DEFAULT_APPEARING_MESSAGE_DELAY
    const cursor        = props.cursor     ?? constants.DEFAULT_APPEARING_MESSAGE_CURSOR
    const cursorTick    = props.cursorTick ?? constants.DEFUALT_APPEARING_MESSAGE_CURSOR_TICK

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