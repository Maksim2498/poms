import useAsync                  from "hooks/useAsync"
import User                      from "logic/User"
import TaggedUserName            from "ui/TaggedUserName/Component"
import UserIcon                  from "ui/UserIcon/Component"
import UserOnlineIndicator       from "ui/UserOnlineIndicator/Component"
import UserNicknames             from "ui/UserNicknames/Component"
import Loading                   from "ui/Loading/Component"
import ErrorText                 from "ui/ErrorText/Component"
import UserRegInfo               from "ui/UserRegInfo/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "App/AuthControllerContext"
import { UserContext           } from "App/UserContext"
import { Props                 } from "./types"

export default function Profile(props: Props) {
    const authController                = useContext(AuthControllerContext)
    const [contextUser, setContextUser] = useContext(UserContext)
    const [user,        loading, error] = useAsync(getUser)
    const { onTagClick                } = props

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
        return <div className={styles.loading}>
            <Loading />
        </div>

    if (error != null)
        return <div className={styles.error}>
            <ErrorText>Loading failed</ErrorText>
        </div>

    return <div className={styles.loaded}>
        <div className={styles.icon}>
            <UserIcon user={user!} />
        </div>
        <div className={styles.taggedName}>
            <TaggedUserName user={user!} onTagClick={innerOnTagClick} />
        </div>
        <div className={styles.onlineIndicator}>
            <UserOnlineIndicator user={user!} />
        </div>

        <div className={styles.sections}>
            <UserRegInfo   user={user!} onTagClick={innerOnTagClick} />
            <UserNicknames user={user!} />
        </div>
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
}