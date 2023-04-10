import User               from "logic/User"
import Fields             from "ui/Fields/Component"
import UserTag            from "ui/UserTag/Component"

import { OnUserTagClick } from "ui/UserTag/Component"

export interface Props {
    onTagClick?: OnUserTagClick
    user:        User
}

export default function UserRegInfo(props: Props) {
    const { login, time } = props.user.reg

    return <Fields header = "Registration Info">
    {{
        Registrar: login != null ? <UserTag login={login} onClick={props.onTagClick} /> : "System",
        Time:      time.toLocaleString()
    }}
    </Fields>
}