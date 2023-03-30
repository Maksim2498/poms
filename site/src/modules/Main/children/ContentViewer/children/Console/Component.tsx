import Terminal                  from "components/Terminal/Component"
import useAsync                  from "hooks/useAsync"
import Loading                   from "ui/Loading/Component"
import ErrorText                 from "ui/ErrorText/Component"

import { useContext, useEffect } from "react"
import { isConsoleAvailable    } from "./api"
import { AuthControllerContext } from "pages/App/Component"

import "./style.css"

export default function Console() {
    const authController              = useContext(AuthControllerContext)
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
        <Terminal />
    </div>
}