import { useState, useEffect } from "react"

import "styles/AppearingMessage.css"

export const DEFAULT_TICK        = 80
export const DEFAULT_CURSOR      = "_"
export const DEFUALT_CURSOR_TICK = 500

export type Props = {
    text:        string
    tick?:       number
    cursor?:     string
    cursorTick?: number
}

export default function AppearingMessage(props: Props) {
    const targetMessage = props.text
    const tick          = props.tick       ?? DEFAULT_TICK
    const cursor        = props.cursor     ?? DEFAULT_CURSOR
    const cursorTick    = props.cursorTick ?? DEFUALT_CURSOR_TICK

    const [message, setMessage] = useState("")

    useEffect(() => {
        const interval = setInterval(() => {
            if (message === targetMessage) {
                clearInterval(interval)
                return
            }

            setMessage(message + targetMessage[message.length])
        }, tick)

        return () => clearInterval(interval)
    })

    const [showCursor, setShowCursor] = useState(true)
    const cursorStub                  = " ".repeat(cursor.length)

    useEffect(() => {
        const interval = setInterval(() => setShowCursor(!showCursor), cursorTick)
        return () => clearInterval(interval)
    })

    return <div className="AppearingMessage">
        {message}{showCursor ? cursor : cursorStub}
    </div>
}