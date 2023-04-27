import useAsync                                              from "hooks/useAsync"
import User                                                  from "logic/User"
import AuthControllerContext                                 from "App/AuthControllerContext"
import UserContext                                           from "App/UserContext"
import LoadingContent                                        from "modules/ContentViewer/LoadingContent/Component"
import ErrorContent                                          from "modules/ContentViewer/ErrorContent/Component"
import UserNicknames                                         from "components/UserNicknames/Component"
import Button                                                from "ui/Button/Component"
import Modal                                                 from "ui/Modal/Component"
import ErrorText                                             from "ui/ErrorText/Component"
import UserTag                                               from "ui/UserTag/Component"
import UserIsAdminCheckBox                                   from "ui/UserIsAdminCheckBox/Component"
import UserName                                              from "ui/UserName/Component"
import UserIcon                                              from "ui/UserIcon/Component"
import UserOnlineIndicator                                   from "ui/UserOnlineIndicator/Component"
import UserRegInfo                                           from "ui/UserRegInfo/Component"
import styles                                                from "./styles.module.css"

import { useContext, useEffect, useRef, useState           } from "react"
import { AnswerStates, ButtonAnswerState, TextAnswerState  } from "ui/Modal/types"
import { ProfileProps                                      } from "./types"

export default function Profile(props: ProfileProps) {
    const authController                          = useContext(AuthControllerContext)
    const [contextUser, setContextUser          ] = useContext(UserContext)
    const [loadedUser, , error                  ] = useAsync(getUser)
    const [user, setUser                        ] = useState(undefined as User | undefined)
    const [changed, setChanged                  ] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [resetingPassword, setResetingPassword] = useState(false)
    const [saving, setSaving                    ] = useState(false)
    const [saveError, setSaveError              ] = useState(undefined as any)
    const savedUser                               = useRef(undefined as User | undefined)
    const { onTagClick, editMode                } = props

    useEffect(() => {
        if (!loadedUser)
            return

        setUser(loadedUser)
        savedUser.current = loadedUser

        if (User.areLoginsEqual(loadedUser.login, contextUser?.login))
            setContextUser(loadedUser)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadedUser])

    useEffect(() => {
        if (editMode)
            return

        setSaveError(undefined)
        setChanged(false)
        setUser(savedUser.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode])

    useEffect(() => {
        if (error != null)
            console.error(error)
    }, [error])

    const loading = user == null && error == null

    if (loading)
        return <LoadingContent />

    if (error != null)
        return <ErrorContent>Loading failed</ErrorContent>

    return <div className={editMode ? styles.editableProfile : styles.profile}>
        <div className={styles.icon}>
            <UserIcon user={user} editMode={editMode} onChange={onChange} />
        </div>

        <div className={styles.sections}>
            <div className={styles.general}>
                {editMode && contextUser?.isAdmin && <UserIsAdminCheckBox user={user!} onChange={onChange} />}
                <UserName user={user!} editMode={editMode} onChange={onChange} />
                <UserTag user={user!} />
                <UserOnlineIndicator user={user!} />
            </div>
            <UserRegInfo   user={user!} onTagClick={innerOnTagClick} />
            <UserNicknames user={user!} editMode={editMode} onChange={onChange}/>
        </div>

        <ErrorText>{saveError}</ErrorText>

        {
            editMode && <div className={styles.buttons}>
                <Button color="red" disabled={saving} onClick={() => setResetingPassword(true)}>Reset password</Button>
                {changed && <Button color="green" onClick={onSave}>Save changed</Button>}
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
            resetingPassword && <Modal header="Password Resetting">
                {{
                    password: {
                        type:         "text",
                        inputType:    "password",
                        placeholder:  "New password",
                        autoComplete: "new-password",
                        disable:      disablePasswordResetItem,
                        validate:     User.validatePassword.bind(User)
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
                        disable:      states => (states.password as TextAnswerState).invalid != null,
                        onClick:      onPasswordReset
                    }
                }}
            </Modal>
        }
    </div>

    async function getUser(): Promise<User> {
        if ("user" in props)
            return props.user

        return await User.get({
            login:          props.login,
            fetchNicknames: true,
            fetchIcon:      true,
            acceptInvalid:  true,
            authController
        })
    }

    function onChange(newUser: User) {
        setChanged(!savedUser.current || !newUser.equalTo(savedUser.current))
        setUser(newUser)
    }

    async function onSave() {
        if (!user || !savedUser.current)
            return

        setSaving(true)

        try {
            await user!.saveDiff(authController, savedUser.current)

            setChanged(false)

            savedUser.current = user

            if (User.areLoginsEqual(savedUser.current.login, contextUser?.login))
                setContextUser(savedUser.current)

            setSaveError(undefined)
        } catch (error) {
            setSaveError(error)
        }

        setSaving(false)
    }

    function innerOnTagClick(login: string) {
        if (!user)
            return

        onTagClick?.(login, user.login)
    }

    function disablePasswordResetItem(states: AnswerStates) {
        return (states.change as ButtonAnswerState).loading
    }

    async function onPasswordReset(states: AnswerStates) {
        if (!user)
            return 

        const login    = user.login
        const password = (states.password as TextAnswerState).value

        await User.setPassword({
            authController,
            login,
            password
        })

        setResetingPassword(false)
    }
}