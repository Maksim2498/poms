import Header            from "modules/Header/Component"
import Main              from "modules/Main/Component"
import Footer            from "modules/Footer/Component"
import Loading           from "ui/Loading/Component"
import useFetchAccess    from "./api/useFetchAccess"

import { createContext } from "react"

import "./style.css"

export const AllowAnonymAccessContext = createContext(false)

export default function App() {
    const [isAnonymAccessAllowed, loading] = useFetchAccess()

    if (loading)
        return <div className="App">
            <Loading />
        </div>

    return <AllowAnonymAccessContext.Provider value={isAnonymAccessAllowed}>
        <div className="App">
            <Header show="not-signed-in" />
            <Main />
            <Footer />
        </div>
    </AllowAnonymAccessContext.Provider>
}