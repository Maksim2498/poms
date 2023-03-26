import ApiManager      from "logic/ApiManager"
import UserName        from "ui/UserName/Component"
import Button          from "ui/Button/Component"

import { useContext  } from "react"
import { UserContext } from "pages/App/Component"

import "./style.css"

export interface Props {
    onSignIn?: OnSignIn
}

export type OnSignIn = () => void

export default function UserButton(props: Props) {
    const [user, setUser] = useContext(UserContext)

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
            <Button type="cancel" onClick={onSignOut}>Sign Out</Button>
        </div>

        async function onSignOut() {
            try {
                await ApiManager.instance.deauth()
            } catch (error) {
                console.error(error)
            } finally {
                setUser(null)
            }
        }
    }

    function notSignedIn() {
        return <div className="not-signed-in">
            <Button type="submit" onClick={props.onSignIn}>Sign In</Button>
        </div>
    }
}