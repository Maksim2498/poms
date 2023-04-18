import useAsync                                               from "hooks/useAsync"
import User                                                   from "logic/User"
import LoadingContent                                         from "modules/ContentViewer/LoadingContent/Component"
import ErrorContent                                           from "modules/ContentViewer/ErrorContent/Component"
import Button                                                 from "ui/Button/Component"
import Modal                                                  from "ui/Modal/Component"
import UserTag                                                from "ui/UserTag/Component"
import UserName                                               from "ui/UserName/Component"
import UserIcon                                               from "ui/UserIcon/Component"
import UserOnlineIndicator                                    from "ui/UserOnlineIndicator/Component"
import UserNicknames                                          from "ui/UserNicknames/Component"
import UserRegInfo                                            from "ui/UserRegInfo/Component"
import styles                                                 from "./styles.module.css"

import { useContext, useEffect, useState                    } from "react"
import { AuthControllerContext                              } from "App/AuthControllerContext"
import { UserContext                                        } from "App/UserContext"
import { AnswerStates, ButtonAnswerState, InputAnswerState  } from "ui/Modal/types"
import { ProfileProps                                       } from "./types"

export default function Profile(props: ProfileProps) {
    const authController                          = useContext(AuthControllerContext)
    const [contextUser, setContextUser          ] = useContext(UserContext)
    const [user, loading, error                 ] = useAsync(getUser)
    const [changingPassword, setChangingPassword] = useState(false)
    const [resetingPassword, setResetingPassword] = useState(false)
    const { onTagClick, editMode                } = props

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    useEffect(() => {
        if (!user || !contextUser)
            return

        if (User.areLoginsEqual(user.login, contextUser.login))
            setContextUser(user)
    }, [user, contextUser, setContextUser])

    if (loading)
        return <LoadingContent />

    if (error != null)
        return <ErrorContent>Loading failed</ErrorContent>

    return <div className={styles.profile}>
        <div className={styles.icon}>
            <UserIcon user={user!} />
        </div>

        <div className={styles.general}>
            <UserName            user={user} />
            <UserTag             user={user} />
            <UserOnlineIndicator user={user!} />
        </div>

        <div className={styles.sections}>
            <UserRegInfo   user={user!} onTagClick={innerOnTagClick} />
            <UserNicknames user={user!} />
        </div>

        {editMode && <Button color="red" onClick={() => setResetingPassword(true)}>Reset password</Button>}

        {
            changingPassword && <Modal header="Password Changing">
                {{
                    cancel: {
                        type:    "button",
                        text:    "Cancel",
                        onClick: () => setChangingPassword(false)
                    }
                }}
            </Modal>
        }

        {
            resetingPassword && <Modal header="Password Reseting">
                {{
                    password: {
                        type:         "input",
                        inputType:    "password",
                        placeholder:  "New password",
                        autoComplete: "new-password",
                        disable:      disablePasswordResetItem,
                        validate:     User.validatePassword
                    },

                    cancel: {
                        type:         "button",
                        text:         "Cancel",
                        disable:      disablePasswordResetItem,
                        onClick:      () => setResetingPassword(false)
                    },

                    change: {
                        type:         "button",
                        text:         "Change",
                        color:        "green",
                        disable:      states => (states.password as InputAnswerState).invalid != null,
                        onClick:      onPasswordReset
                    }
                }}
            </Modal>
        }
    </div>

    async function getUser(): Promise<User> {
        if ("user" in props)
            return props.user

        return await User.fetch({
            fetchNicknames: true,
            login:          props.login,
            authController
        })
    }

    function innerOnTagClick(login: string) {
        onTagClick?.(login, user!.login)
    }

    function disablePasswordResetItem(states: AnswerStates) {
        return (states.change as ButtonAnswerState).loading
    }

    async function onPasswordReset(states: AnswerStates) {
        const login    = user!.login
        const password = (states.password as InputAnswerState).value

        await User.setPassword({
            authController,
            login,
            password
        })

        setResetingPassword(false)
    }
}