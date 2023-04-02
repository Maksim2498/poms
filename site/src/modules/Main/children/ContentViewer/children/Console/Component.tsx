import useAsync                                                    from "hooks/useAsync"
import useForceRerender                                            from "hooks/useForceRerender"
import ConsoleSocket                                               from "./ConsoleSocket"
import Terminal                                                    from "components/Terminal/Component"
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
    const forceRerender                       = useForceRerender()
    const socket                              = useRef(undefined as ConsoleSocket | undefined)
    const reconnectTimeout                    = useRef(undefined as number        | undefined)
    const tryReconnect                        = useRef(true)

    useEffect(() => {
        if (error != null)
            console.error(error)
    }, [error])

    useEffect(() => {
        console.log(socket.current?.state)
        tryReconnect.current = true

        initSocket()
        
        return () => {
            tryReconnect.current = false
            socket.current?.disconnect()

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

    const disabled = socket.current?.state !== "authorized"

    return <div className="loaded available Console">
        <Terminal records={records} onEnter={onEnter} disabled={disabled} />
    </div>

    function onEnter(newRecord: Record) {
        const willSend =  newRecord.type        === "input"
                       && socket.current?.state === "authorized"

        if (willSend)
            socket.current!.send(newRecord.text)

        const oldRecords = recordsRef.current ?? []
        const newRecords = [...oldRecords, newRecord]

        setRecords(newRecords)
    }

    async function initSocket(): Promise<void> {
        await new Promise<void>(resolve => {
            pushRecord("info", "Connecting...")

            const newSocket = new ConsoleSocket()

            newSocket.on("connection-lost", () => {
                pushRecord("error", "Connection lost")
                initReconnect()
            })

            newSocket.on("connection-failed", () => {
                pushRecord("error", "Connection failed")
                initReconnect()
            })

            newSocket.on("disconnected", () => {
                socket.current = undefined
                forceRerender()
            })


            newSocket.on("authorized", () => {
                pushRecord("success", "Authorized")
                socket.current = newSocket
                forceRerender()
                resolve()
            })

            newSocket.on("authorization-failed", ()   => pushRecord("error", "Authorization failed"))
            newSocket.on("authorizing",          ()   => pushRecord("info", "Authorizing..."))
            newSocket.on("connected",            ()   => pushRecord("success", "Connected"))
            newSocket.on("messagae",             text => pushRecord("output", text))

        })

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

    function pushRecord(type: Type, text: string) {
        const newRecord  = makeRecord(type, text)
        const oldRecords = recordsRef.current ?? []
        const newRecords = [...oldRecords, newRecord]

        setRecords(newRecords)
    }
}