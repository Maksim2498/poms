import User                                                                      from "logic/User"
import useAsync                                                                  from "hooks/useAsync"
import useForceRerender                                                          from "hooks/useForceRerender"
import AuthControllerContext                                                     from "App/AuthControllerContext"
import UserContext                                                               from "App/UserContext"
import LoadingContent                                                            from "modules/ContentViewer/LoadingContent/Component"
import ErrorContent                                                              from "modules/ContentViewer/ErrorContent/Component"
import UserCard                                                                  from "ui/UserCard/Component"
import Button                                                                    from "ui/Button/Component"
import Modal                                                                     from "ui/Modal/Component"
import styles                                                                    from "./styles.module.css"

import { useContext, useEffect, useState                                       } from "react"
import { ButtonAnswerState, TextAnswerState, AnswerStates, CheckBoxAnswerState } from "ui/Modal/types"
import { UsersProps                                                            } from "./types"

export default function Users(props: UsersProps) {
    const forceRerender                 = useForceRerender()
    const { onUserClick, editMode     } = props
    const [contextUser, setContextUser] = useContext(UserContext)
    const authController                = useContext(AuthControllerContext)
    const [authInfo, setAuthInfo      ] = authController
    const [users, loading, error      ] = useAsync(getUsers)
    const [target,   setTarget        ] = useState(undefined as { user: User, index: number } | undefined)
    const [creating, setCreating      ] = useState(false)

    useEffect(clearTarget, [editMode])

    useEffect(() => {
        if (!users)
            return

        for (const user of users) {
            if (user == null)
                continue

            const updateContextUser =  contextUser
                                    && User.areLoginsEqual(user.login, contextUser.login)
                                    && !contextUser.equalTo(user)

            if (updateContextUser)
                setContextUser(user)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users])

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <LoadingContent />

    if (error != null)
        return <ErrorContent>Loading failed</ErrorContent>

    return <div className={editMode ? styles.editableUsers : styles.users}>
        <div className={styles.listContainer}>
            {
                editMode && <div className={styles.create}>
                    <Button onClick={onCreate}>Create new user</Button>
                </div>
            }
            <ul className={styles.list}>
                {
                    users.map((user, index) => user && <li key={user.login} className={styles.item}>
                        <UserCard user={user} onClick={onUserClick} />
                        {editMode && <Button color="red" onClick={() => onDelete(user, index)}>Delete</Button>}
                    </li>)
                }
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
                        type:         "text",
                        placeholder:  "Login",
                        validate:     User.validateNormedLogin.bind(User),
                        disable:      disableCreationItem
                    },

                    password: {
                        type:         "text",
                        placeholder:  "Password",
                        inputType:    "password",
                        autoComplete: "new-password",
                        validate:     User.validatePassword.bind(User),
                        disable:      disableCreationItem
                    },

                    name: {
                        type:         "text",
                        placeholder:  "Name",
                        validate:     User.validateName.bind(User),
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
                        disable:      disableCreateItem
                    }
                }}
            </Modal>
        }
    </div>

    async function getUsers(): Promise<(User | undefined)[]> {
        const gotUsers = await User.fetchAll({
            authController,
            deferIconLoading: true,
        })

        const sortedUsers = User.sort(gotUsers)

        for (const user of sortedUsers)
            if (user.icon instanceof Promise)
                user.icon
                    .then(icon => {
                        const index = indexOf(user)

                        if (index === -1)
                            return

                        sortedUsers[index] = user.withIcon(icon)

                        forceRerender()
                    })
                    .catch(error => {
                        console.error(error)

                        const index = indexOf(user)

                        if (index === -1)
                            return

                        sortedUsers[index] = user.withIcon(undefined)

                        forceRerender()
                    })

        return sortedUsers

        function indexOf(targetUser: User): number {
            for (const [i, user] of sortedUsers.entries())
                if (User.areLoginsEqual(targetUser.login, user?.login))
                    return i

            return -1
        }
    }

    function disableCreationItem(states: AnswerStates) {
        return (states.create as ButtonAnswerState).loading
    }

    function disableCreateItem(states: AnswerStates) {
        return (states.login    as TextAnswerState).invalid != null
            || (states.password as TextAnswerState).invalid != null
            || (states.name     as TextAnswerState).invalid != null
    }

    function onCreate() {
        clearTarget()
        setCreating(true)
    }

    async function onCreateConfirm(states: AnswerStates) {
        if (!users)
            return

        const { value:   login    } = states.login    as TextAnswerState
        const { value:   password } = states.password as TextAnswerState
        const { value:   name     } = states.name     as TextAnswerState
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

        if (User.areLoginsEqual(contextUser?.login, target.user.login)) {
            setAuthInfo(authInfo.withoutTokenPair())
            setContextUser(undefined)
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