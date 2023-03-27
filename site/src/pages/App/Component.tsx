import User                        from "logic/User"
import useAsync                    from "hooks/useAsync"
import Header                      from "modules/Header/Component"
import Main                        from "modules/Main/Component"
import Footer                      from "modules/Footer/Component"
import Loading                     from "ui/Loading/Component"
import AuthInfo                    from "logic/AuthInfo"

import { createContext, useEffect, useState } from "react"

import "./style.css"

export const UserContext         = createContext([undefined,      defaultSetNullableUser] as UserContextType    )
export const AuthInfoContext     = createContext([new AuthInfo(), defaultSetAuthInfo    ] as AuthInfoContextType)

function defaultSetNullableUser() {
    throw new Error("Missing UserContext.Provider")
}

function defaultSetAuthInfo() {
    throw new Error("Missing AuthInfoContext.Provider")
}

export type UserContextType     = [OptionalUser, SetNullableUser]
export type SetNullableUser     = (user: OptionalUser) => void
export type OptionalUser        = User | undefined

export type AuthInfoContextType = [AuthInfo, SetAuthInfo]
export type SetAuthInfo         = (info: AuthInfo) => void

export default function App() {
    const [authInfo,     setAuthInfo    ] = useState(AuthInfo.loadOrDefault())
    const [user,         setUser        ] = useState(authInfo.tokenPair != null ? User.safeLoad() : undefined)
    const [showAuthForm, setShowAuthForm] = useState(false)
    const [,             authInfoLoading] = useAsync(updateAuthInfo)
    const [,             userLoading    ] = useAsync(updateUser, [authInfo])

    useEffect(() => {
        if (authInfo.tokenPair == null)
            setUser(undefined)

        authInfo.save()
    }, [authInfo])

    useEffect(() => {
        if (user == null)
            User.remove()
        else
            user.save()
    }, [user])

    const loading =  authInfoLoading
                  || userLoading

    if (loading)
        return <div className="App">
            <Loading />
        </div>

    return <AuthInfoContext.Provider value={[authInfo, setAuthInfo]}>
        <UserContext.Provider value={[user, setUser]}>
            <div className="App">
                {header()}
                {main()}
                <Footer />
            </div>
        </UserContext.Provider>
    </AuthInfoContext.Provider>

    async function updateAuthInfo() {
        let newAuthInfo = authInfo

        try {
            newAuthInfo = await newAuthInfo.withUpdatedAllowAnonymAccess()
        } catch (error) {
            console.error(error)
        }

        if (authInfo.tokenPair != null)
            try {
                newAuthInfo = await newAuthInfo.withRefreshedTokenPair()
            } catch (error) {
                newAuthInfo = newAuthInfo.withoutTokenPair()
                setUser(undefined)
                console.error(error)
            }

        setAuthInfo(newAuthInfo)
    }

    async function updateUser() {
        try {
            setUser(await user?.updated(authInfo))
        } catch (error) {
            console.error(error)
        }
    }

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