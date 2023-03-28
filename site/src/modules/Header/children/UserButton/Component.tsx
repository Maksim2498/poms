import UserName                               from "ui/UserName/Component"
import Button                                 from "ui/Button/Component"
import UserIcon                               from "ui/UserIcon/Component"

import { useContext, useState               } from "react"
import { AuthControllerContext, UserContext } from "pages/App/Component"
import { deauth                             } from "logic/api"

import "./style.css"

export interface Props {
    onSignIn?: OnSignIn
}

export type OnSignIn = () => void

export default function UserButton(props: Props) {
    const authController                = useContext(AuthControllerContext)
    const [user,        setUser       ] = useContext(UserContext)
    const [showSignOut, setShowSignOut] = useState(false)

    return <div className="UserButton">
        {body()}
    </div>

    function body() {
        return user != null ? signedIn()
                            : notSignedIn()
    }

    function signedIn() {
        return <div className="signed-in">
            <UserName user={user!} />
            <div onClick={() => setShowSignOut(!showSignOut)}>
                <UserIcon user={user!} />
            </div>
            <div className="options" style={{ display: showSignOut ? "block" : "none" }}>
                <Button type="cancel" onClick={onSignOut}>Sign Out</Button>
            </div>
        </div>

        async function onSignOut() {
            try {
                await deauth(authController)
            } catch (error) {
                console.error(error)
            } finally {
                setUser(undefined)
            }
        }
    }

    function notSignedIn() {
        return <div className="not-signed-in">
            <Button type="submit" onClick={props.onSignIn}>Sign In</Button>
        </div>
    }
}