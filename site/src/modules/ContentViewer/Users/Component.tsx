import useAsync                  from "hooks/useAsync"
import User                      from "logic/User"
import UserCard                  from "ui/UserCard/Component"
import Loading                   from "ui/Loading/Component"
import ErrorText                 from "ui/ErrorText/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "App/AuthControllerContext"
import { Props                 } from "./types"

export default function Users(props: Props) {
    const { onUserClick         } = props
    const authController          = useContext(AuthControllerContext)
    const [users, loading, error] = useAsync(async () => User.fetchAll({ authController }))

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

    return <ul className={styles.loaded}>
        {users.map(user =>
            <li key={user.login}>
                <UserCard user={user} onClick={onUserClick} />
            </li>
        )}
    </ul>
}