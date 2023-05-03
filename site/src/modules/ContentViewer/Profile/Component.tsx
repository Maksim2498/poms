import useAsync                                              from "hooks/useAsync"
import User                                                  from "logic/User"
import styles                                                from "./styles.module.css"

import { useContext, useEffect, useRef, useState           } from "react"
import { AuthInfoContext, UserContext                      } from "App"
import { UserNicknames                                     } from "components/UserNicknames"
import { Button                                            } from "ui/Button"
import { Modal                                             } from "ui/Modal"
import { ErrorText                                         } from "ui/ErrorText"
import { UserTag                                           } from "ui/UserTag"
import { UserIsAdminCheckBox                               } from "ui/UserIsAdminCheckBox"
import { UserName                                          } from "ui/UserName"
import { UserIcon                                          } from "ui/UserIcon"
import { UserOnlineIndicator                               } from "ui/UserOnlineIndicator"
import { UserRegInfo                                       } from "ui/UserRegInfo"
import { AnswerStates, ButtonAnswerState, TextAnswerState  } from "ui/Modal/types"
import { LoadingContent                                    } from "../LoadingContent"
import { ErrorContent                                      } from "../ErrorContent"
import { ProfileProps                                      } from "./types"

export default function Profile(props: ProfileProps) {
    const { onTagClick, editMode                } = props

    const authInfoRef                             = useContext(AuthInfoContext)
    const contextUserRef                          = useContext(UserContext)

    const [loadedUser, , error                  ] = useAsync(fetchUser, [], () => abortControllerRef.current?.abort())

    const [initUser, setInitUser                ] = useState(undefined as User | undefined)
    const [user, setUser                        ] = useState(undefined as User | undefined)
    const [changed, setChanged                  ] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [resetingPassword, setResetingPassword] = useState(false)
    const [saving, setSaving                    ] = useState(false)
    const [saveError, setSaveError              ] = useState(undefined as any)

    const savedUserRef                            = useRef(undefined as User            | undefined)
    const abortControllerRef                      = useRef(undefined as AbortController | undefined)

    useEffect(() => {
        if (loadedUser != null)
            setInitUser(loadedUser)
    }, [loadedUser])

    useEffect(() => {
        if (!initUser)
            return

        setUser(initUser)
        savedUserRef.current = initUser

        const updateContextUser =  User.areLoginsEqual(initUser.login, contextUserRef.current?.login)
                                && !(initUser.icon instanceof Promise)

        if (updateContextUser)
            contextUserRef.current = initUser
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initUser])

    useEffect(() => {
        if (editMode)
            return

        setSaveError(undefined)
        setChanged(false)
        setUser(savedUserRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode])

    useEffect(() => {
        if (error != null && !abortControllerRef.current?.signal.aborted)
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
                {editMode && contextUserRef.current?.isAdmin && <UserIsAdminCheckBox user={user!} onChange={onChange} />}
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

    async function fetchUser(): Promise<User> {
        if ("user" in props)
            return props.user

        abortControllerRef.current = new AbortController()

        const { signal } = abortControllerRef.current

        const user = await User.fetch({
            login:            props.login,
            fetchNicknames:   true,
            acceptInvalid:    true,
            deferIconLoading: true,
            authInfoRef,
            signal,
        })

        if (user.icon instanceof Promise)
            user.icon
                .then(icon => setInitUser(user.withIcon(icon)))
                .catch(error => {
                    if (signal.aborted)
                        return

                    console.error(error)

                    setInitUser(user.withIcon(undefined))
                })

        return user
    }

    function onChange(newUser: User) {
        setChanged(!savedUserRef.current || !newUser.equalTo(savedUserRef.current))
        setUser(newUser)
    }

    async function onSave() {
        if (!user || !savedUserRef.current)
            return

        setSaving(true)

        try {
            await user.saveDiff(authInfoRef, savedUserRef.current)

            setChanged(false)

            savedUserRef.current = user

            if (User.areLoginsEqual(savedUserRef.current.login, contextUserRef.current?.login))
                contextUserRef.current = savedUserRef.current

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

        await User.sendPassword({
            authInfoRef,
            login,
            password
        })

        setResetingPassword(false)
    }
}