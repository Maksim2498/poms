import User                                                                             from "logic/User"
import useAsync                                                                         from "hooks/useAsync"
import useForceRerender                                                                 from "hooks/useForceRerender"
import styles                                                                           from "./styles.module.css"

import { useContext, useEffect, useState, useRef                                      } from "react"
import { AuthInfoContext, UserContext                                                 } from "App"
import { UserCard                                                                     } from "ui/UserCard"
import { Button                                                                       } from "ui/Button"
import { Modal, ButtonAnswerState, TextAnswerState, AnswerStates, CheckBoxAnswerState } from "ui/Modal"
import { LoadingContent                                                               } from "../LoadingContent"
import { ErrorContent                                                                 } from "../ErrorContent"
import { UsersProps                                                                   } from "./types"

export default function Users(props: UsersProps) {
    const { onUserClick, editMode     } = props

    const forceRerender                 = useForceRerender()

    const contextUserRef                = useContext(UserContext)
    const authInfoRef                   = useContext(AuthInfoContext)

    const [users, loading, error      ] = useAsync(fetchUsers, [], () => abortControllerRef.current?.abort())

    const [target,   setTarget        ] = useState(undefined as { user: User, index: number } | undefined)
    const [creating, setCreating      ] = useState(false)

    const abortControllerRef            = useRef(undefined as AbortController | undefined)

    useEffect(clearTarget, [editMode])

    useEffect(() => {
        if (error != null && !abortControllerRef.current?.signal.aborted)
            console.error(error)
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

    async function fetchUsers(): Promise<(User | undefined)[]> {
        abortControllerRef.current = new AbortController()

        const { signal } = abortControllerRef.current

        const gotUsers = await User.fetchAll({
            deferIconLoading: true,
            authInfoRef,
            signal,
        })

        const sortedUsers = User.sort(gotUsers)

        for (const user of sortedUsers)
            if (user.icon instanceof Promise)
                user.icon
                    .then(icon => userIconReady(user, icon))
                    .catch(error => {
                        if (signal.aborted)
                            return

                        console.error(error)

                        userIconReady(user, undefined)
                    })

        return sortedUsers

        function userIconReady(user: User, icon: string | undefined) {
            const index = indexOf(user)

            if (index === -1)
                return
            
            const newUser = user.withIcon(icon)

            sortedUsers[index] = newUser

            updateContextUserIfNeeded(newUser)
            forceRerender()
        }

        function updateContextUserIfNeeded(user: User) {
            const updateContextUser =  contextUserRef.current
                                    && User.areLoginsEqual(user.login, contextUserRef.current.login)
                                    && !contextUserRef.current.equalTo(user)

            if (updateContextUser)
                contextUserRef.current = user
        }

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

        const newUser = await User.register({ authInfoRef, login, password, name, isAdmin })

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

        await target.user.del(authInfoRef)

        if (User.areLoginsEqual(contextUserRef.current?.login, target.user.login)) {
            authInfoRef.current    = authInfoRef.current.withoutTokenPair()
            contextUserRef.current = undefined

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