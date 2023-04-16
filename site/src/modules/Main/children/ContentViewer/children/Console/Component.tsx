import * as motd                         from "minecraft-motd-util"
import Autolinker                        from "autolinker"
import useAsync                          from "hooks/useAsync"
import useForceRerender                  from "hooks/useForceRerender"
import Terminal                          from "components/Terminal/Component"
import Loading                           from "ui/Loading/Component"
import ErrorText                         from "ui/ErrorText/Component"
import ConsoleSocket                     from "./ConsoleSocket"
import styles                            from "./styles.module.css"

import { useContext, useEffect, useRef } from "react"
import { AuthControllerContext         } from "App/AuthControllerContext"
import { TerminalContext               } from "components/Terminal/Context"
import { makeRecord                    } from "components/Terminal/util"
import { Record, RecordType            } from "components/Terminal/types"
import { isConsoleAvailable            } from "./api"

export const RECONNECT_INTERVAL = 5

export default function Console() {
    const authController                      = useContext(AuthControllerContext)
    const [,          setRecords, recordsRef] = useContext(TerminalContext)
    const [available, loading,    error     ] = useAsync(async () => isConsoleAvailable(authController))
    const forceRerender                       = useForceRerender()
    const socket                              = useRef(undefined as ConsoleSocket | undefined)
    const reconnectTimeout                    = useRef(undefined as number        | undefined)
    const tryReconnect                        = useRef(true)

    useEffect(() => {
        if (error != null)
            console.error(error)
    }, [error])

    useEffect(() => {
        tryReconnect.current = true

        if (socket.current == null)
            initSocket()
        
        return () => {
            tryReconnect.current = false
            socket.current?.disconnect()

            if (reconnectTimeout.current != null) {
                clearTimeout(reconnectTimeout.current)
                pushRecord("info", "Reconnection aborted")
            }

            if (socket.current?.state === "connecting")
                pushRecord("info", "Connection aborted")
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading)
        return <div className={styles.loading}>
            <Loading />
        </div>

    if (error != null)
        return <div className={styles.error}>
            <ErrorText>Loading failed</ErrorText>
        </div>

    if (!available)
        return <div className={styles.unavailable}>
            <ErrorText>Console is unavailable</ErrorText>
        </div>

    const disabled = socket.current?.state !== "authorized"

    return <div className={styles.loaded}>
        <Terminal onEnter={onEnter} disabled={disabled} htmlOutput={true} />
    </div>

    function onEnter(newRecord: Record) {
        const willSend =  newRecord.type        === "input"
                       && socket.current?.state === "authorized"

        if (willSend) {
            const { text } = newRecord
            const toSend   = text.replace(/^\s*\/\s*/, "")
            socket.current!.send(toSend)
        }

        const oldRecords = recordsRef.current ?? []
        const newRecords = [...oldRecords, newRecord]

        setRecords(newRecords)
    }

    function initSocket() {
        pushRecord("info", "Connecting...")

        const newSocket = new ConsoleSocket()

        newSocket.on("disconnected", () => {
            pushRecord("info", "Disconnected")
            socket.current = undefined
            initReconnect()
            forceRerender()
        })

        newSocket.on("authorized", () => {
            pushRecord("success", "Authorized")
            forceRerender()
        })

        newSocket.on("connected", () => {
            pushRecord("success", "Connected")

            const [authInfo]    = authController
            const { tokenPair } = authInfo

            if (tokenPair == null) {
                pushRecord("error", "Cannot authorize")
                newSocket.disconnect()
                return
            }

            const accessTokenId = tokenPair.access.id

            newSocket.auth(accessTokenId)
        })

        newSocket.on("connection-lost",      ()   => pushRecord("error", "Connection lost"))
        newSocket.on("connection-failed",    ()   => pushRecord("error", "Connection failed"))
        newSocket.on("authorization-failed", ()   => pushRecord("error", "Authorization failed"))
        newSocket.on("authorizing",          ()   => pushRecord("info",  "Authorizing..."))
        newSocket.on("messagae",             text => pushRecord("output", fmtMessage(text)))

        socket.current = newSocket

        function fmtMessage(message: string): string {
            return Autolinker.link(
                motd.toHTML(
                    motd.parse(message)
                )
            )
        }

        function initReconnect() {
            if (!tryReconnect.current)
                return

            pushRecord("info", `Reconnecting in ${RECONNECT_INTERVAL} seconds...`)

            reconnectTimeout.current = window.setTimeout(() => {
                reconnectTimeout.current = undefined
                initSocket()
            }, 1000 * RECONNECT_INTERVAL)
        }
    }

    function pushRecord(type: RecordType, text: string) {
        const newRecord  = makeRecord(type, text)
        const oldRecords = recordsRef.current ?? []
        const newRecords = [...oldRecords, newRecord]

        setRecords(newRecords)
    }
}