import AuthInfo                                          from "logic/AuthInfo"
import User                                              from "logic/User"
import useAsync                                          from "hooks/useAsync"
import useLiveRef                                        from "hooks/useLiveRef"
import styles                                            from "./styles.module.css"

import { useEffect, useRef, useState                   } from "react"
import { reauth                                        } from "logic/api"
import { OptionalUser                                  } from "logic/User"
import { ContentStackContext, setContent, HOME_CONTENT } from "modules/ContentViewer"
import { TerminalRecord, TerminalContext               } from "components/Terminal"
import { MaxNicknamesContext                           } from "components/UserNicknames"
import { Loading                                       } from "ui/Loading"
import { AuthInfoContext                               } from "./AuthInfoContext"
import { UserContext                                   } from "./UserContext"
import { Header                                        } from "./Header"
import { Main                                          } from "./Main"
import { Footer                                        } from "./Footer"

export default function App() {
    const authInfoRef                     = useLiveRef(AuthInfo.loadOrDefault())
    const authInfo                        = authInfoRef.current
    const userRef                         = useLiveRef(authInfo.tokenPair != null ? User.safeLoad() : undefined)
    const user                            = userRef.current
    const recordsRef                      = useLiveRef([] as TerminalRecord[])
    const contentStackRef                 = useLiveRef([HOME_CONTENT])

    const oldUserRef                      = useRef(undefined as OptionalUser)
    const oldUser                         = oldUserRef.current

    const [authInfoUpdated              ] = useAsync(updateAuthInfo               )
    const [contextUserUpdated           ] = useAsync(updateContextUser, [authInfo])
    const [maxNicknames                 ] = useAsync(getMaxNicknames,   [authInfo])
    const maxNicknamesUpdated             = typeof maxNicknames === "number"

    const [showAuthForm, setShowAuthForm] = useState(false)

    useEffect(() => authInfo.save(), [authInfo])

    useEffect(() => {
        User.save(user)

        if (!User.areLoginsEqual(user?.login, oldUser?.login)) {
            setContent(contentStackRef, HOME_CONTENT)
            recordsRef.current = []
        }

        oldUserRef.current = user
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const loading =  !authInfoUpdated
                  || !contextUserUpdated
                  || !maxNicknamesUpdated

    if (loading)
        return <div className={styles.app}>
            <Loading />
        </div>

    return <AuthInfoContext.Provider value={authInfoRef}>
        <MaxNicknamesContext.Provider value={maxNicknames!}>
            <UserContext.Provider value={userRef}>
                <ContentStackContext.Provider value={contentStackRef}>
                    <TerminalContext.Provider value={recordsRef}>
                        <div className={styles.app}>
                            {header()}
                            {main()}
                            <Footer />
                        </div>
                    </TerminalContext.Provider>
                </ContentStackContext.Provider>
            </UserContext.Provider>
        </MaxNicknamesContext.Provider>
    </AuthInfoContext.Provider>

    async function updateAuthInfo(): Promise<boolean> {
        try {
            authInfoRef.current = await authInfoRef.current.withUpdatedAllowAnonymAccess()
        } catch (error) {
            console.error(error)
        }

        if (authInfoRef.current.tokenPair == null)
            return true

        try {
            await reauth(authInfoRef)
        } catch (error) {
            authInfoRef.current = authInfoRef.current.withoutTokenPair()
            console.error(error)
        }

        return true
    }

    async function updateContextUser(): Promise<boolean> {
        if (!authInfoUpdated)
            return false

        if (authInfoRef.current.tokenPair == null) {
            userRef.current = undefined
            return true
        }

        try {
            userRef.current = await userRef.current?.updated({
                deferIconLoading: true,
                authInfoRef,
            })

            const icon = userRef.current?.icon
            
            if (icon instanceof Promise)
                icon.then(icon => userRef.current = userRef.current?.withIcon(icon))
                    .catch(error => {
                        console.error(error)
                        userRef.current = userRef.current?.withIcon(undefined)
                    })
        } catch (error) {
            console.error(error)
        }

        return true
    }

    async function getMaxNicknames(): Promise<number | boolean> {
        if (!authInfoUpdated)
            return false

        try {
            return await User.fetchMaxNicknames(authInfoRef)
        } catch (error) {
            console.error(error)
            return 5
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