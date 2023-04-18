import * as motd                              from "minecraft-motd-util"
import Autolinker                             from "autolinker"
import useAsync                               from "hooks/useAsync"
import useForceRerender                       from "hooks/useForceRerender"
import LoadingContent                         from "modules/ContentViewer/LoadingContent/Component"
import ErrorContent                           from "modules/ContentViewer/ErrorContent/Component"
import Terminal                               from "components/Terminal/Component"
import ConsoleSocket                          from "./ConsoleSocket"
import styles                                 from "./styles.module.css"

import { useContext, useEffect, useRef      } from "react"
import { AuthControllerContext              } from "App/AuthControllerContext"
import { TerminalContext                    } from "components/Terminal/Context"
import { makeTerminalRecord                 } from "components/Terminal/util"
import { TerminalRecord, TerminalRecordType } from "components/Terminal/types"
import { isConsoleAvailable                 } from "./api"
import { RECONNECT_INTERVAL                 } from "./constants"

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

    useEffect(() => {
        if (!available)
            return

        if (socket.current == null)
            initSocket()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [available])

    if (loading)
        return <LoadingContent />

    if (error != null)
        return <ErrorContent>Loading failed</ErrorContent>

    if (!available)
        return <ErrorContent>Console is unavailable</ErrorContent>

    const disabled = socket.current?.state !== "authorized"

    return <div className={styles.console}>
        <Terminal onEnter={onEnter} disabled={disabled} htmlOutput={true} />
    </div>

    function onEnter(newRecord: TerminalRecord) {
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

    function pushRecord(type: TerminalRecordType, text: string) {
        const newRecord  = makeTerminalRecord(type, text)
        const oldRecords = recordsRef.current ?? []
        const newRecords = [...oldRecords, newRecord]

        setRecords(newRecords)
    }
}