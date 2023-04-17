import User                                from "logic/User"
import useAsync                            from "hooks/useAsync"
import UserCard                            from "ui/UserCard/Component"
import Loading                             from "ui/Loading/Component"
import ErrorText                           from "ui/ErrorText/Component"
import Button                              from "ui/Button/Component"
import Modal                               from "ui/Modal/Component"
import styles                              from "./styles.module.css"

import { useContext, useEffect, useState } from "react"
import { AuthControllerContext           } from "App/AuthControllerContext"
import { UserContext                     } from "App/UserContext"
import { UsersProps                      } from "./types"

export default function Users(props: UsersProps) {
    const { onUserClick, editMode } = props
    const [user, setUser          ] = useContext(UserContext)
    const authController            = useContext(AuthControllerContext)
    const [authInfo, setAuthInfo  ] = authController
    const [users, loading, error  ] = useAsync(async () => User.fetchAll({ authController }) as Promise<(User | undefined)[]>)
    const [target, setTarget      ] = useState(undefined as { user: User, index: number } | undefined)

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
                    <Button onClick={() => alert("Not implemented")}>Create new user</Button>
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
            target && <Modal header="Confirmation" question={`Do you really want to delete user "${target.user.login}"?`}>
                {[
                    {
                        text:      "Cancel",
                        onClick:   onDeleteCancel,
                        autoFocus: true
                    },
                    {
                        text:    "Delete",
                        color:   "red",
                        onClick: onDeleteConfirm
                    }
                ]}
            </Modal>
        }
    </div>

    async function onDelete(user: User, index: number) {
        setTarget({ user, index })
    }

    function onDeleteCancel() {
        clearTarget()
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
}