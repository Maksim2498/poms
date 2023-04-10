import UserName                               from "ui/UserName/Component"
import Button                                 from "ui/Button/Component"
import UserIcon                               from "ui/UserIcon/Component"
import styles                                 from "./styles.module.css"

import { useContext, useState               } from "react"
import { AuthControllerContext, UserContext } from "pages/App/Component"
import { deauth                             } from "logic/api"

export interface Props {
    onSignIn?: OnSignIn
}

export type OnSignIn = () => void

export default function UserButton(props: Props) {
    const authController                = useContext(AuthControllerContext)
    const [user,        setUser       ] = useContext(UserContext)
    const [showOptions, setShowOptions] = useState(false)

    if (user == null)
        return <div className={styles.notSignedIn}>
            <Button type="submit" onClick={props.onSignIn}>Sign In</Button>
        </div>

    return <div className={styles.signedIn}>
        <div className={styles.name}>
            <UserName user={user!} />
        </div>
        <div className={styles.icon}>
            <UserIcon user={user!} onClick={() => setShowOptions(!showOptions)} />
        </div>
        <div className={styles.options} style={{ display: showOptions ? "block" : "none" }}>
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