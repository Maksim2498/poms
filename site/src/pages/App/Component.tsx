import AuthInfo          from "logic/AuthInfo"
import Header            from "modules/Header/Component"
import Main              from "modules/Main/Component"
import Footer            from "modules/Footer/Component"
import AuthFrom          from "components/AuthForm/Component"
import Loading           from "ui/Loading/Component"
import useFetchAccess    from "./api/useFetchAccess"

import "./style.css"

import { createContext, useState } from "react"

export const AllowAnonymAccessContext = createContext(false)
export const AuthInfoContext          = createContext(null as AuthInfo | null)

export default function App() {
    const [isAnonymAccessAllowed, loading        ] = useFetchAccess()
    const [showAuthForm,          setShowAuthForm] = useState(false)
    const [authInfo,              setAuthInfo    ] = useState(null as AuthInfo | null)

    if (loading)
        return <div className="App">
            <Loading />
        </div>

    return <AllowAnonymAccessContext.Provider value={isAnonymAccessAllowed}>
        <AuthInfoContext.Provider value={null}>
            <div className="App">
                {header()}
                {main()}
                <Footer />
            </div>
        </AuthInfoContext.Provider>
    </AllowAnonymAccessContext.Provider>

    function header() {
        if (showAuthForm)
            return <Header show="none" />

        if (authInfo != null)
            return <Header show="signed-in" user={authInfo.user} />

        return <Header show="not-signed-in" onSignIn={() => setShowAuthForm(true)} />
    }

    function main() {
        if (showAuthForm) {
            const component = () => AuthFrom({ onAuth: info => setAuthInfo(info)})
            const name      = "Sign In"

            return <Main content={{ name, component }} />
        }

        return <Main />
    }
}