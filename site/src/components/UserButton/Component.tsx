import UserName                                     from "ui/UserName/Component"
import Button                                       from "ui/Button/Component"
import UserIcon                                     from "ui/UserIcon/Component"
import styles                                       from "./styles.module.css"

import { useContext, useState, useEffect, useRef  } from "react"
import { AuthControllerContext                    } from "App/AuthControllerContext"
import { UserContext                              } from "App/UserContext"
import { deauth                                   } from "logic/api"
import { UserButtonProps                          } from "./types"

export default function UserButton(props: UserButtonProps) {
    const authController                = useContext(AuthControllerContext)
    const [user,        setUser       ] = useContext(UserContext)
    const [showOptions, setShowOptions] = useState(false)
    const signedInRef                   = useRef(null as HTMLDivElement | null)

    useEffect(() => {
        document.addEventListener("click", handleClickOutside)

        return () => document.removeEventListener("click", handleClickOutside)
        
        function handleClickOutside(event: MouseEvent) {
            console.log(signedInRef.current, event.target)
            if (!signedInRef.current?.contains(event.target as Node)) {
                console.log("Close")
                setShowOptions(false)
            }
        }
    }, [signedInRef])

    if (user == null)
        return <div className={styles.notSignedIn}>
            <Button color="green" onClick={props.onSignIn}>Sign In</Button>
        </div>

    return <div className={styles.signedIn} ref={signedInRef}>
        <div className={styles.user} onClick={() => setShowOptions(!showOptions)}>
            <div className={styles.name}>
                <UserName user={user!} />
            </div>
            <div className={styles.icon}>
                <UserIcon user={user!} />
            </div>
        </div>

        {
            showOptions && <div className={styles.options}>
                <Button color="red" onClick={onSignOut}>Sign Out</Button>
            </div>
        }
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