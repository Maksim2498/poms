import User from "logic/User";

export interface Props {
    user: User
}

export default function UserName(props: Props) {
    const { user } = props

    return <div className="UserName">
        {user.name ?? user.login}
    </div>
}