import useAsync                  from "hooks/useAsync"
import User                      from "logic/User"
import UserCard                  from "ui/UserCard/Component"
import Loading                   from "ui/Loading/Component"
import ErrorText                 from "ui/ErrorText/Component"

import { useContext, useEffect } from "react"
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

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <div className="loading Users">
            <Loading />
        </div>

    if (error != null)
        return <div className="error Users">
            <ErrorText>Loading failed</ErrorText>
        </div>

    return <ul className="loaded Users">
        {users.map(user =>
            <li key={user.login}>
                <UserCard user={user} onClick={onUserClick} />
            </li>
        )}
    </ul>
}