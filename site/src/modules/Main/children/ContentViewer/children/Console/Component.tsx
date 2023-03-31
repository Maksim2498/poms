import Terminal                                                    from "components/Terminal/Component"
import useAsync                                                    from "hooks/useAsync"
import Loading                                                     from "ui/Loading/Component"
import ErrorText                                                   from "ui/ErrorText/Component"

import { useContext, useEffect, createContext, useRef, RefObject } from "react"
import { AuthControllerContext                                   } from "pages/App/Component"
import { Record, makeRecord, Type                                } from "components/Terminal/Component"
import { isConsoleAvailable                                      } from "./api"

import "./style.css"

export const RECONNECT_INTERVAL = 5

export const ConsoleContext = createContext([[], defaultSetRecords, { current: null }] as ConsoleContextType)

function defaultSetRecords() {
    throw new Error("Missing ConsoleContext.Provider")
}

export type ConsoleContextType = [Record[], SetRecords, RefObject<Record[]>]
export type SetRecords         = (newRecords: Record[]) => void

export default function Console() {
    const authController                      = useContext(AuthControllerContext)
    const [records,   setRecords, recordsRef] = useContext(ConsoleContext)
    const [available, loading,    error     ] = useAsync(async () => isConsoleAvailable(authController))
    const socket                              = useRef(undefined as WebSocket | undefined)
    const tryReconnect                        = useRef(true)
    const reconnectTimeout                    = useRef(undefined as number    | undefined)

    useEffect(() => {
        if (error != null)
            console.error(error)
    }, [error])

    useEffect(() => {
        tryReconnect.current = true

        initSocket()
        
        return () => {
            tryReconnect.current = false
            socket.current?.close()

            if (reconnectTimeout.current != null) {
                clearTimeout(reconnectTimeout.current)
                pushRecord("info", "Reconnection aborted")
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading)
        return <div className="loading Console">
            <Loading />
        </div>

    if (error != null)
        return <div className="error Console">
            <ErrorText>Loading failed</ErrorText>
        </div>

    if (!available)
        return <div className="loaded unavailable Console">
            <ErrorText>Console is unavailable</ErrorText>
        </div>

    return <div className="loaded available Console">
        <Terminal records={records} onEnter={onEnter} disabled={socket.current == null} />
    </div>

    function onEnter(newRecord: Record) {
        const oldRecords = recordsRef.current ?? []
        const newRecords = [...oldRecords, newRecord]

        setRecords(newRecords)
    }

    async function initSocket(): Promise<void> {
        return await new Promise(resolve => {
            pushRecord("info", "Connecting...")

            const host = window.location.host
            const url  = `wss://${host}/ws/console`

            try {
                const newSocket          = new WebSocket(url)
                let   prevState          = newSocket.readyState
                let   isConnectionFailed = false

                newSocket.onopen = event => {
                    prevState      = newSocket.readyState
                    socket.current = newSocket

                    pushRecord("success", "Connected")
                    resolve()
                }

                newSocket.onerror = () => {
                    if (handleConnectionFailedError())
                        return

                    prevState      = newSocket.readyState
                    socket.current = undefined

                    pushRecord("error", "Connection lost")
                    initReconnection()
                }

                newSocket.onmessage = event => pushRecord("output", event.data)

                newSocket.onclose = event => {
                    if (handleConnectionFailedError())
                        return

                    prevState      = newSocket.readyState
                    socket.current = undefined

                    pushRecord("info", "Connection closed")
                }

                function handleConnectionFailedError(): boolean {
                    if (isConnectionFailed)
                        return true

                    if (prevState === WebSocket.CONNECTING) {
                        connectionFailed()

                        isConnectionFailed = true

                        return true
                    }

                    return false
                }
            } catch (error) {
                console.error(error)
                connectionFailed()
            }
        })

        function connectionFailed() {
            pushRecord("error", "Connection failed")
            initReconnection()
        }

        function initReconnection() {
            if (!tryReconnect.current)
                return

            pushRecord("info", `Reconnecting in ${RECONNECT_INTERVAL} seconds...`)

            reconnectTimeout.current = window.setTimeout(initSocket, 1000 * RECONNECT_INTERVAL)
        }
    }

    function pushRecord(type: Type, text: string) {
        const newRecord  = makeRecord(type, text)
        const oldRecords = recordsRef.current ?? []
        const newRecords = [...oldRecords, newRecord]

        setRecords(newRecords)
    }
}