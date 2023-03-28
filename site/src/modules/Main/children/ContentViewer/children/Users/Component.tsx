import useAsync                  from "hooks/useAsync"
import User                      from "logic/User"
import UserCard                  from "ui/UserCard/Component"
import Loading                   from "ui/Loading/Component"
import ErrorText                 from "ui/ErrorText/Component"

import { useContext            } from "react"
import { AuthControllerContext } from "pages/App/Component"
import { OnUserCardClick       } from "ui/UserCard/Component"

import "./style.css"

export interface Props {
    onUserClick?: OnUserCardClick
}

export default function Users(props: Props) {
    const { onUserClick         } = props
    const authController          = useContext(AuthControllerContext)
    const [users, loading, error] = useAsync(async () => User.fetchAll({ authController }))
    const className               = "Users"

    if (loading)
        return <div className={className}>
            <Loading />
        </div>

    if (error != null)
        return <div className={className}>
            <ErrorText>{error}</ErrorText>
        </div>

    return <ul className={className}>
        {users.map(user =>
            <li key={user.login}>
                <UserCard user={user} onClick={onUserClick} />
            </li>
        )}
    </ul>
}