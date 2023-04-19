import useAsync                                               from "hooks/useAsync"
import User                                                   from "logic/User"
import LoadingContent                                         from "modules/ContentViewer/LoadingContent/Component"
import ErrorContent                                           from "modules/ContentViewer/ErrorContent/Component"
import Button                                                 from "ui/Button/Component"
import CheckBox                                               from "ui/CheckBox/Component"
import Input                                                  from "ui/Input/Component"
import Modal                                                  from "ui/Modal/Component"
import UserTag                                                from "ui/UserTag/Component"
import UserName                                               from "ui/UserName/Component"
import UserIcon                                               from "ui/UserIcon/Component"
import UserOnlineIndicator                                    from "ui/UserOnlineIndicator/Component"
import UserNicknames                                          from "ui/UserNicknames/Component"
import UserRegInfo                                            from "ui/UserRegInfo/Component"
import styles                                                 from "./styles.module.css"

import { useContext, useEffect, useRef, useState            } from "react"
import { AuthControllerContext                              } from "App/AuthControllerContext"
import { UserContext                                        } from "App/UserContext"
import { AnswerStates, ButtonAnswerState, InputAnswerState  } from "ui/Modal/types"
import { ProfileProps                                       } from "./types"

export default function Profile(props: ProfileProps) {
    const authController                          = useContext(AuthControllerContext)
    const [contextUser, setContextUser          ] = useContext(UserContext)
    const [loadedUser, loadingUser, error       ] = useAsync(getUser)
    const [user, setUser                        ] = useState(undefined as User | undefined)
    const [changedUser, setChangedUser          ] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [resetingPassword, setResetingPassword] = useState(false)
    const isUserAdmin                             = useRef(false)
    const userName                                = useRef("")
    const savedUser                               = useRef(undefined as User | undefined)
    const { onTagClick, editMode                } = props

    useEffect(() => {
        if (!loadedUser)
            return

        setUser(loadedUser)

        savedUser.current   = loadedUser
        userName.current    = loadedUser.name ?? ""
        isUserAdmin.current = loadedUser.isAdmin

        if (User.areLoginsEqual(loadedUser.login, contextUser?.login))
            setContextUser(loadedUser)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadedUser])

    useEffect(() => {
        if (editMode)
            return

        userName.current = savedUser.current?.name ?? ""

        setUser(savedUser.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode])

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    const loading = loadingUser || user == null

    if (loading)
        return <LoadingContent />

    if (error != null)
        return <ErrorContent>Loading failed</ErrorContent>

    return <div className={styles.profile}>
        <div className={styles.icon}>
            <UserIcon user={user} />
        </div>

        <div className={styles.general}>
            {
                editMode
             && contextUser?.isAdmin
             && <CheckBox checked={isUserAdmin.current} onChange={onIsUserAdminChanged}>Admin:</CheckBox>
            }
            {
                editMode ? <Input value={userName.current} onChange={onUserNameChanged} placeholder="User name" />
                         : <UserName user={user} />
            }
            <UserTag user={user} />
            <UserOnlineIndicator user={user} />
        </div>

        <div className={styles.sections}>
            <UserRegInfo   user={user} onTagClick={innerOnTagClick} />
            <UserNicknames user={user} />
        </div>

        {
            editMode && <div className={styles.buttons}>
                <Button color="red" onClick={() => setResetingPassword(true)}>Reset password</Button>
                {changedUser && <Button color="green" onClick={onSave}>Save changed</Button>}
            </div>
        }

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

    function onIsUserAdminChanged(isAdmin: boolean) {
        const newUser = user!.withIsAdmin(isAdmin)

        setChangedUser(newUser.isAdmin !== savedUser.current!.isAdmin)
        setUser(newUser)

        isUserAdmin.current = isAdmin
    }

    function onUserNameChanged(name: string) {
        const newUser = user!.withName(name)

        setChangedUser(newUser.name !== savedUser.current!.name)
        setUser(newUser)

        userName.current = name
    }

    async function onSave() {
        try {
            await user!.saveDiff(authController, savedUser.current!)
        } catch (error) {
            console.error(error)
        }

        savedUser.current = user!

        if (User.areLoginsEqual(savedUser.current.login, contextUser?.login))
            setContextUser(savedUser.current)
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