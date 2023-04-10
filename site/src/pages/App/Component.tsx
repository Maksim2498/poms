import useStateRef                                    from "react-usestateref"
import User                                           from "logic/User"
import useAsync                                       from "hooks/useAsync"
import Header                                         from "modules/Header/Component"
import Main                                           from "modules/Main/Component"
import Footer                                         from "modules/Footer/Component"
import Loading                                        from "ui/Loading/Component"
import AuthInfo                                       from "logic/AuthInfo"
import styles                                         from "./styles.module.css"

import { createContext, useEffect, useRef, useState } from "react"
import { AuthController, reauth                     } from "logic/api"
import { Record                                     } from "components/Terminal/Component"
import { TerminalContext                            } from "components/Terminal/Component"
import { ContentStackContext, HOME_CONTENT          } from "modules/Main/children/ContentViewer/Component"

export const UserContext           = createContext([undefined,      defaultSetNullableUser] as UserContextType)
export const AuthControllerContext = createContext([new AuthInfo(), defaultSetAuthInfo    ] as AuthController )

function defaultSetNullableUser() {
    throw new Error("Missing UserContext.Provider")
}

function defaultSetAuthInfo() {
    throw new Error("Missing AuthControllerContext.Provider")
}

export type UserContextType = [OptionalUser, SetNullableUser]
export type SetNullableUser = (user: OptionalUser) => void
export type OptionalUser    = User | undefined

export default function App() {
    const [contentStack, setContentStack, contentStackRef] = useStateRef([HOME_CONTENT])
    const [records,      setRecords,      recordsRef     ] = useStateRef([] as Record[])
    const [authInfo,     setAuthInfo                     ] = useState(AuthInfo.loadOrDefault())
    const [user,         setUser                         ] = useState(authInfo.tokenPair != null ? User.safeLoad() : undefined)
    const [showAuthForm, setShowAuthForm                 ] = useState(false)
    const [,             authInfoLoading                 ] = useAsync(updateAuthInfo)
    const [,             userLoading                     ] = useAsync(updateUser, [authInfo])
    const oldUser                                          = useRef(undefined as User | undefined)

    useEffect(() => authInfo.save(), [authInfo])

    useEffect(() => {
        User.save(user)

        if (!User.areLoginsEqual(user?.login, oldUser.current?.login))
            setRecords([])

        oldUser.current = user
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const loading =  authInfoLoading
                  || userLoading

    if (loading)
        return <div className={styles.app}>
            <Loading />
        </div>

    return <AuthControllerContext.Provider value={[authInfo, setAuthInfo]}>
        <UserContext.Provider value={[user, setUser]}>
            <ContentStackContext.Provider value={[contentStack, setContentStack, contentStackRef]}>
                <TerminalContext.Provider value={[records, setRecords, recordsRef]}>
                    <div className={styles.app}>
                        {header()}
                        {main()}
                        <Footer />
                    </div>
                </TerminalContext.Provider>
            </ContentStackContext.Provider>
        </UserContext.Provider>
    </AuthControllerContext.Provider>

    async function updateAuthInfo() {
        let newAuthInfo = authInfo

        try {
            newAuthInfo = await newAuthInfo.withUpdatedAllowAnonymAccess()
        } catch (error) {
            console.error(error)
        }

        if (newAuthInfo.tokenPair != null)
            try {
                newAuthInfo = await reauth([newAuthInfo, setAuthInfo])
            } catch (error) {
                newAuthInfo = newAuthInfo.withoutTokenPair()
                console.error(error)
            }

        setAuthInfo(newAuthInfo)
    }

    async function updateUser() {
        try {
            if (authInfo.tokenPair == null) {
                setUser(undefined)
                return
            }

            const updatedUser = await user?.updated({ authController: [authInfo, setAuthInfo] })

            setUser(updatedUser)
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