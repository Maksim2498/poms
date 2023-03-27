import User from "logic/User"

import "./style.css"

export interface Props {
    user: User
}

export default function UserNicknames(props: Props) {
    const { nicknames } = props.user

    return <ul className="UserNicknames">
        {nicknames.map(n => <li key={n}>{n}</li>)}
    </ul>
}