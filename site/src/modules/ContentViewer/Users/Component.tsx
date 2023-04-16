import User                      from "logic/User"
import useAsync                  from "hooks/useAsync"
import useForceRerender          from "hooks/useForceRerender"
import UserCard                  from "ui/UserCard/Component"
import Loading                   from "ui/Loading/Component"
import ErrorText                 from "ui/ErrorText/Component"
import Button                    from "ui/Button/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "App/AuthControllerContext"
import { UserContext           } from "App/UserContext"
import { Props                 } from "./types"

export default function Users(props: Props) {
    const { onUserClick, editMode } = props
    const [user, setUser          ] = useContext(UserContext)
    const authController            = useContext(AuthControllerContext)
    const [authInfo, setAuthInfo  ] = authController
    const [users, loading, error  ] = useAsync(async () => User.fetchAll({ authController }) as Promise<(User | undefined)[]>)
    const forceRerender             = useForceRerender()

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
        <ul className={styles.list}>
            {users.map((user, index) =>
                user && <li key={user.login} className={styles.item}>
                    <UserCard user={user} onClick={onUserClick} />
                    {editMode && <Button type="cancel" onClick={() => onDelete(user, index)}>Delete</Button>}
                </li>
            )}
        </ul>
    </div>

    async function onDelete(targetUser: User, index: number) {
        try {
            await targetUser.del(authController)

            if (User.areLoginsEqual(user?.login, targetUser.login)) {
                setUser(undefined)
                setAuthInfo(authInfo.withoutTokenPair())
                return
            }
        
            users![index] = undefined

            forceRerender()
        } catch (error) {
            console.error(error)
        }
    }
}