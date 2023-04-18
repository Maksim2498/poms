import User                                                                       from "logic/User"
import useAsync                                                                   from "hooks/useAsync"
import UserCard                                                                   from "ui/UserCard/Component"
import Loading                                                                    from "ui/Loading/Component"
import ErrorText                                                                  from "ui/ErrorText/Component"
import Button                                                                     from "ui/Button/Component"
import Modal                                                                      from "ui/Modal/Component"
import styles                                                                     from "./styles.module.css"

import { useContext, useEffect, useState                                        } from "react"
import { AuthControllerContext                                                  } from "App/AuthControllerContext"
import { UserContext                                                            } from "App/UserContext"
import { ButtonAnswerState, InputAnswerState, AnswerStates, CheckBoxAnswerState } from "ui/Modal/types"
import { UsersProps                                                             } from "./types"

export default function Users(props: UsersProps) {
    const { onUserClick, editMode } = props
    const [user, setUser          ] = useContext(UserContext)
    const authController            = useContext(AuthControllerContext)
    const [authInfo, setAuthInfo  ] = authController
    const [users, loading, error  ] = useAsync(async () => User.fetchAll({ authController }) as Promise<(User | undefined)[]>)
    const [target,   setTarget    ] = useState(undefined as { user: User, index: number } | undefined)
    const [creating, setCreating  ] = useState(false)

    useEffect(clearTarget, [editMode])

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <div className={styles.loading}>
            <Loading />
        </div>

    if (error != null)
        return <div className={styles.error}>
            <ErrorText>Loading failed</ErrorText>
        </div>

    return <div className={styles.loaded}>
        <div className={styles.listContainer}>
            {
                editMode && <div className={styles.createButton}>
                    <Button onClick={onCreate}>Create new user</Button>
                </div>
            }
            <ul className={styles.list}>
                {users.map((user, index) =>
                    user && <li key={user.login} className={styles.item}>
                        <UserCard user={user} onClick={onUserClick} />
                        {editMode && <Button color="red" onClick={() => onDelete(user, index)}>Delete</Button>}
                    </li>
                )}
            </ul>
        </div>
        {
            target && <Modal header="User Deletion" question={`Do you really want to delete user "${target.user.login}"?`}>
                {{
                    cancel: {
                        type:      "button",
                        text:      "Cancel",
                        onClick:   clearTarget,
                        disable:   states => (states.delete as ButtonAnswerState).loading,
                        autoFocus: true
                    },

                    delete: {
                        type:      "button",
                        text:      "Delete",
                        color:     "red",
                        onClick:   onDeleteConfirm
                    }
                }}
            </Modal>
        }
        {
            creating && <Modal header="User Creation">
                {{
                    login: {
                        type:         "input",
                        placeholder:  "Login",
                        validate:     User.validateLogin,
                        format:       login => login.trim(),
                        disable:      disableCreationItem
                    },

                    password: {
                        type:         "input",
                        placeholder:  "Password",
                        inputType:    "password",
                        autoComplete: "new-password",
                        validate:     User.validatePassword,
                        disable:      disableCreationItem
                    },

                    name: {
                        type:         "input",
                        placeholder:  "Name",
                        format:       name => name.trim(),
                        disable:      disableCreationItem
                    },

                    isAdmin: {
                        type:         "check-box",
                        label:        "Admin:"
                    },

                    cancel: {
                        type:         "button",
                        text:         "Cancel",
                        onClick:      resetCreating,
                        autoFocus:    true,
                        disable:      disableCreationItem
                    },

                    create: {
                        type:         "button",
                        text:         "Create",
                        color:        "green",
                        onClick:      onCreateConfirm,
                        disable:      states => (states.login    as InputAnswerState).invalid != null
                                             || (states.password as InputAnswerState).invalid != null
                    }
                }}
            </Modal>
        }
    </div>

    function disableCreationItem(states: AnswerStates) {
        return (states.create as ButtonAnswerState).loading
    }

    function onCreate() {
        clearTarget()
        setCreating(true)
    }

    async function onCreateConfirm(states: AnswerStates) {
        if (!users)
            return

        const { value:   login    } = states.login    as InputAnswerState
        const { value:   password } = states.password as InputAnswerState
        const { value:   name     } = states.name     as InputAnswerState
        const { checked: isAdmin  } = states.isAdmin  as CheckBoxAnswerState

        const newUser = await User.register({ authController, login, password, name, isAdmin })

        users.push(newUser)

        resetCreating()
    }

    async function onDelete(user: User, index: number) {
        resetCreating()
        setTarget({ user, index })
    }

    async function onDeleteConfirm() {
        if (!target || !users)
            return

        await target.user.del(authController)

        if (User.areLoginsEqual(user?.login, target.user.login)) {
            setAuthInfo(authInfo.withoutTokenPair())
            setUser(undefined)
            return
        }

        users[target.index] = undefined

        clearTarget()
    }

    function clearTarget() {
        setTarget(undefined)
    }

    function resetCreating() {
        setCreating(false)
    }
}