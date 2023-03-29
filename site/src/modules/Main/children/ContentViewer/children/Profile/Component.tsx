import useAsync                  from "hooks/useAsync"
import User                      from "logic/User"
import TaggedUserName            from "ui/TaggedUserName/Component"
import UserIcon                  from "ui/UserIcon/Component"
import UserOnlineIndicator       from "ui/UserOnlineIndicator/Component"
import UserTag                   from "ui/UserTag/Component"
import UserNicknames             from "ui/UserNicknames/Component"
import Field                     from "ui/Field/Component"
import Loading                   from "ui/Loading/Component"
import ErrorText                 from "ui/ErrorText/Component"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "pages/App/Component"

import "./style.css"

export type Props = UserProps
                  | LoginProps

export interface UserProps {
    onTagClick?: OnTagClick
    user:        User
}

export interface LoginProps {
    onTagClick?: OnTagClick
    login:       string
}

export type OnTagClick = (newLogin: string, oldLogin: string) => void

export default function Profile(props: Props) {
    const authController         = useContext(AuthControllerContext)
    const [user, loading, error] = useAsync(getUser)
    const { onTagClick         } = props

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <div className="loading Profile">
            <Loading />
        </div>

    if (error != null)
        return <div className="error Profile">
            <ErrorText>Loading failed</ErrorText>
        </div>

    return <div className="loaded Profile">
        <UserIcon            user={user!} />
        <TaggedUserName      user={user!} onTagClick={innerOnTagClick} />
        <UserOnlineIndicator user={user!} />

        <div className="reg section">
            <h3>Registration info</h3>
            <Field label="Registrar">
                {user!.reg.login != null ? <UserTag login={user!.reg.login} onClick={innerOnTagClick} /> : "System"}
            </Field>
            <Field label="Time">
                {user!.reg.time.toLocaleDateString()}
            </Field>
        </div>

        {nicknames()}
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

    function nicknames() {
        if (user!.nicknames.length === 0)
            return undefined

        return <div className="section">
            <h3>Nicknames</h3>
            <UserNicknames user={user!} />
        </div>
    }

    function innerOnTagClick(login: string) {
        onTagClick?.(login, user!.login)
    }
}