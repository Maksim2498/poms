import AuthInfo                    from "logic/AuthInfo"
import Header                      from "modules/Header/Component"
import Main                        from "modules/Main/Component"
import Footer                      from "modules/Footer/Component"
import Loading                     from "ui/Loading/Component"
import useFetchAccess              from "./api/useFetchAccess"

import { createContext, useState } from "react"

import "./style.css"

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
            return <Main show="auth" onAuth={onAuth} onCancel={onCancel} />

            function onAuth(info: AuthInfo) {
                setAuthInfo(info)
                setShowAuthForm(false)
                info.save()
            }

            function onCancel() {
                setShowAuthForm(false)
            }
        }

        return <Main show="content" />
    }
}