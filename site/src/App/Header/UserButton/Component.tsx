import styles                                                  from "./styles.module.css"

import { useContext, useState, useEffect, useRef             } from "react"
import { deauth                                              } from "logic/api"
import { AuthInfoContext, UserContext                        } from "App"
import { ContentStackContext, setContent, makeProfileContent } from "modules/ContentViewer"
import { UserName                                            } from "ui/UserName"
import { Button                                              } from "ui/Button"
import { UserIcon                                            } from "ui/UserIcon"
import { UserButtonProps                                     } from "./types"

export default function UserButton(props: UserButtonProps) {
    const authInfoRef                   = useContext(AuthInfoContext)
    const contentStackRef               = useContext(ContentStackContext)
    const contextUserRef                = useContext(UserContext)
    const contextUser                   = contextUserRef.current
    const [showOptions, setShowOptions] = useState(false)
    const signedInRef                   = useRef(null as HTMLDivElement | null)

    useEffect(() => {
        document.addEventListener("click", handleClickOutside)

        return () => document.removeEventListener("click", handleClickOutside)
        
        function handleClickOutside(event: MouseEvent) {
            if (!signedInRef.current?.contains(event.target as Node))
                setShowOptions(false)
        }
    }, [signedInRef])

    if (contextUser == null)
        return <div className={styles.notSignedIn}>
            <Button color="green" onClick={props.onSignIn}>Sign In</Button>
        </div>

    return <div className={styles.signedIn} ref={signedInRef}>
        <div className={styles.user} onClick={onToggleOptions}>
            <div className={styles.name}>
                <UserName user={contextUser!} />
            </div>

            <div className={styles.icon}>
                <UserIcon user={contextUser!} />
            </div>
        </div>

        {
            showOptions && <div className={styles.options}>
                <Button onClick={onProfile}>
                    Profile
                </Button>

                <Button color="red" onClick={onSignOut}>
                    Sign Out
                </Button>
            </div>
        }
    </div>

    function onToggleOptions() {
        setShowOptions(!showOptions)
    }

    function onProfile() {
        if (!contextUser)
            return

        const profileContent = makeProfileContent(contentStackRef, contextUser, contextUser)

        setContent(contentStackRef, profileContent)
    }

    async function onSignOut() {
        await deauth(authInfoRef)

        contextUserRef.current = undefined
    }
}