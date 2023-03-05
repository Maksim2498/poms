import User       from "logic/User"
import LogicError from "logic/LogicError"
import Header     from "components/Header"
import Main       from "components/Main"
import Footer     from "components/Footer"

import {useState       } from "react"
import { auth, deauth  } from "logic/auth"
import { useEffectOnce } from "hooks/useEffectOnce"

import "./App.css"

export default function App() {
    const [mainLoading,    setMainLoading   ] = useState(true)
    const [signOutLoading, setSignOutLoading] = useState(false)
    const [signInLoading,  setSignInLoading ] = useState(false)
    const [signInError,    setSignInError   ] = useState(undefined as string | undefined)
    const [user,           setUser          ] = useState(undefined as User   | undefined)
    const [signIn,         setSignIn        ] = useState(false)

    useEffectOnce(() => {
        User.tryLoadUser().then(loaded => setUser(loaded))
                          .catch(error => console.error(error))
                          .finally(()  => setMainLoading(false))
    })

    return <div className="App">
        {header()}
        {main()}
        <Footer />
    </div>

    function header() {
        if (signIn || mainLoading)
            return <Header />

        if (user)
            return <Header user        = {user}
                           show        = "sign-out"
                           buttonState = {signOutLoading ? "loading" : "active"}
                           onSignOut   = { async () => {
                               setSignOutLoading(true)

                               try {
                                   await deauth(true)
                               } catch (error) {
                                   console.error(error)
                               } finally {
                                   setUser(undefined)
                                   setSignOutLoading(false)
                               }
                           }} />

        return <Header show = "sign-in" onSignIn={() => setSignIn(true)} />
    }

    function main() {
        if (mainLoading)
            return <Main show="loading" />

        if (signIn)
            return <Main show        = "sign-in"
                         loading     = {signInLoading}
                         commonError = {signInError}
                         onCancel    = {() => { setSignIn(false); setSignInError(undefined) }}
                         onSignIn    = {async (login, password) => {
                            setSignInLoading(true)

                            try {
                                await auth(login, password)

                                const user = await User.tryLoadUser()

                                if (user) {
                                    setUser(user)
                                    setSignIn(false)
                                }

                                setSignInError(undefined)
                            } catch (error) {
                                if (error instanceof LogicError) {
                                    setSignInError(error.message)
                                } else {
                                    setSignInError("Something unexpected happened")
                                    console.error(error)
                                }
                            } finally {
                                setSignInLoading(false)
                            }
                         }}/>
        
        if (user)
            return <Main show="user-panel" user={user} />

        return <Main show="greeting" />
    }
}