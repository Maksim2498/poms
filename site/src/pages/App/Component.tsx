import ApiManager                  from "logic/ApiManager"
import User                        from "logic/User"
import useAsync                    from "hooks/useAsync"
import Header                      from "modules/Header/Component"
import Main                        from "modules/Main/Component"
import Footer                      from "modules/Footer/Component"
import Loading                     from "ui/Loading/Component"

import { createContext, useEffect, useState } from "react"

import "./style.css"

export const AllowAnonymConxtext = createContext(false)
export const UserContext         = createContext([null, defaultSetNullableUser] as UserContextType)

function defaultSetNullableUser() {
    throw new Error("Missing UserContext.Provider")
}

export type UserContextType = [NullableUser, SetNullableUser]
export type SetNullableUser = (user: NullableUser) => void
export type NullableUser    = User | null

export default function App() {
    const [apiManager,   loading        ] = useAsync(async () => ApiManager.laod())
    const [user,         setUser        ] = useState(null as User | null)
    const [showAuthForm, setShowAuthForm] = useState(false)

    useEffect(() => setUser(apiManager?.user ?? null), [apiManager])

    if (loading)
        return <div className="App">
            <Loading />
        </div>

    return <AllowAnonymConxtext.Provider value={apiManager?.isAnonymAccessAllowed ?? false}>
        <UserContext.Provider value={[user, setUser]}>
            <div className="App">
                {header()}
                {main()}
                <Footer />
            </div>
        </UserContext.Provider>
    </AllowAnonymConxtext.Provider>

    function header() {
        if (showAuthForm)
            return <Header show="none" />

        return <Header show="user" onSignIn={revealAuthForm} />

        function revealAuthForm() {
            setShowAuthForm(true)
        }
    }

    function main() {
        if (showAuthForm) {
            return <Main show="auth" onAuth={hideAuthForm} onCancel={hideAuthForm} />

            function hideAuthForm() {
                setShowAuthForm(false)
            }
        }

        return <Main show="content" />
    }
}