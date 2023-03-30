import Terminal                                 from "components/Terminal/Component"
import useAsync                                 from "hooks/useAsync"
import Loading                                  from "ui/Loading/Component"
import ErrorText                                from "ui/ErrorText/Component"

import { useContext, useEffect, createContext } from "react"
import { AuthControllerContext                } from "pages/App/Component"
import { Record                               } from "components/Terminal/Component"
import { isConsoleAvailable                   } from "./api"

import "./style.css"

export const ConsoleContext = createContext([[], defaultSetRecords] as ConsoleContextType)

function defaultSetRecords() {
    throw new Error("Missing ConsoleContext.Provider")
}

export type ConsoleContextType = [Record[], SetRecords]
export type SetRecords         = (newRecords: Record[]) => void

export default function Console() {
    const authController              = useContext(AuthControllerContext)
    const [records,   setRecords    ] = useContext(ConsoleContext)
    const [available, loading, error] = useAsync(async () => isConsoleAvailable(authController))

    useEffect(() => {
        if (error != null)
            console.error(error)
    }, [error])

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
        <Terminal records={records} onEnter={onEnter} />
    </div>

    function onEnter(record: Record) {
        setRecords([...records, record])
    }
}