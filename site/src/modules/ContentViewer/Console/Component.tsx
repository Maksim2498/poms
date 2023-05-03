import * as motd                                     from "minecraft-motd-util"
import Autolinker                                    from "autolinker"
import useAsync                                      from "hooks/useAsync"
import useForceRerender                              from "hooks/useForceRerender"
import ConsoleSocket                                 from "./ConsoleSocket"
import styles                                        from "./styles.module.css"

import { useContext, useEffect, useRef             } from "react"
import { isConsoleAvailable                        } from "logic/api"
import { AuthInfoContext                           } from "App"
import { TerminalRecord,
         Terminal, TerminalContext,
         pushNewTerminalRecord, pushTerminalRecord } from "components/Terminal"
import { LoadingContent                            } from "../LoadingContent"
import { ErrorContent                              } from "../ErrorContent"
import { RECONNECT_INTERVAL                        } from "./constants"

export default function Console() {
    const authInfoRef                 = useContext(AuthInfoContext)
    const recordsRef                  = useContext(TerminalContext)

    const [available, loading, error] = useAsync(fetchIsConsoleAvailable, [], () => abortControllerRef.current?.abort())

    const forceRerender               = useForceRerender()

    const socket                      = useRef(undefined as ConsoleSocket   | undefined)
    const reconnectTimeout            = useRef(undefined as number          | undefined)
    const tryReconnect                = useRef(true)
    const abortControllerRef          = useRef(undefined as AbortController | undefined)

    useEffect(() => {
        if (error != null && !abortControllerRef.current?.signal.aborted)
            console.error(error)
    }, [error])

    useEffect(() => {
        tryReconnect.current = true

        return () => {
            tryReconnect.current = false
            socket.current?.disconnect()

            if (reconnectTimeout.current != null) {
                clearTimeout(reconnectTimeout.current)
                pushNewTerminalRecord(recordsRef, "info", "Reconnection aborted")
            }

            if (socket.current?.state === "connecting")
                pushNewTerminalRecord(recordsRef, "info", "Connection aborted")
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

    async function fetchIsConsoleAvailable(): Promise<boolean> {
        abortControllerRef.current = new AbortController()

        const { signal } = abortControllerRef.current

        return await isConsoleAvailable(authInfoRef, signal)
    }

    function onEnter(newRecord: TerminalRecord) {
        if (disabled || newRecord.type !== "input")
            return

        const { text } = newRecord
        const toSend   = text.replace(/^\s*\/\s*/, "")

        socket.current!.send(toSend)

        pushTerminalRecord(recordsRef, newRecord)
    }

    function initSocket() {
        pushNewTerminalRecord(recordsRef, "info", "Connecting...")

        const newSocket = new ConsoleSocket()

        newSocket.on("disconnected", () => {
            pushNewTerminalRecord(recordsRef, "info", "Disconnected")
            socket.current = undefined
            initReconnect()
            forceRerender()
        })

        newSocket.on("authorized", () => {
            pushNewTerminalRecord(recordsRef, "success", "Authorized")
            forceRerender()
        })

        newSocket.on("connected", () => {
            pushNewTerminalRecord(recordsRef, "success", "Connected")

            const { tokenPair } = authInfoRef.current

            if (tokenPair == null) {
                pushNewTerminalRecord(recordsRef, "error", "Cannot authorize")
                newSocket.disconnect()
                return
            }

            const accessTokenId = tokenPair.access.id

            newSocket.auth(accessTokenId)
        })

        newSocket.on("connection-lost",      ()   => pushNewTerminalRecord(recordsRef, "error", "Connection lost"))
        newSocket.on("connection-failed",    ()   => pushNewTerminalRecord(recordsRef, "error", "Connection failed"))
        newSocket.on("authorization-failed", ()   => pushNewTerminalRecord(recordsRef, "error", "Authorization failed"))
        newSocket.on("authorizing",          ()   => pushNewTerminalRecord(recordsRef, "info",  "Authorizing..."))
        newSocket.on("messagae",             text => pushNewTerminalRecord(recordsRef, "output", fmtMessage(text)))

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

            pushNewTerminalRecord(recordsRef, "info", `Reconnecting in ${RECONNECT_INTERVAL} seconds...`)

            reconnectTimeout.current = window.setTimeout(() => {
                reconnectTimeout.current = undefined
                initSocket()
            }, 1000 * RECONNECT_INTERVAL)
        }
    }
}