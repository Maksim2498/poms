import useStateRef                     from "react-usestateref"
import AuthInfo                        from "logic/AuthInfo"
import User                            from "logic/User"
import useAsync                        from "hooks/useAsync"
import Loading                         from "ui/Loading/Component"
import Header                          from "./Header/Component"
import Main                            from "./Main/Component"
import Footer                          from "./Footer/Component"
import styles                          from "./styles.module.css"

import { useEffect, useRef, useState } from "react"
import { reauth                      } from "logic/api"
import { TerminalRecord              } from "components/Terminal/types"
import { TerminalContext             } from "components/Terminal/Context"
import { ContentStackContext         } from "modules/ContentViewer/Context"
import { HOME_CONTENT                } from "modules/ContentViewer/constants"
import { AuthControllerContext       } from "./AuthControllerContext"
import { UserContext                 } from "./UserContext"

export default function App() {
    const [contentStack, setContentStack, contentStackRef] = useStateRef([HOME_CONTENT])
    const [records,      setRecords,      recordsRef     ] = useStateRef([] as TerminalRecord[])
    const [authInfo,     setAuthInfo                     ] = useState(AuthInfo.loadOrDefault())
    const [user,         setUser                         ] = useState(authInfo.tokenPair != null ? User.safeLoad() : undefined)
    const [showAuthForm, setShowAuthForm                 ] = useState(false)
    const [,             authInfoLoading                 ] = useAsync(updateAuthInfo)
    const [,             userLoading                     ] = useAsync(updateUser, [authInfo])
    const oldUser                                          = useRef(undefined as User | undefined)

    useEffect(() => authInfo.save(), [authInfo])

    useEffect(() => {
        User.save(user)

        if (!User.areLoginsEqual(user?.login, oldUser.current?.login)) {
            setContentStack([HOME_CONTENT])
            setRecords([])
        }

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

        return <Header show="user" onSignIn={revealAuthForm} onLogoClick={onLogoClick} />

        function revealAuthForm() {
            setShowAuthForm(true)
        }

        function onLogoClick() {
            setContentStack([HOME_CONTENT])
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