import Fields    from "ui/Fields/Component"
import UserTag   from "ui/UserTag/Component"

import { Props } from "./types"

export default function UserRegInfo(props: Props) {
    const { login, time } = props.user.reg

    return <Fields header = "Registration Info">
    {{
        Registrar: login != null ? <UserTag login={login} onClick={props.onTagClick} /> : "System",
        Time:      time.toLocaleString()
    }}
    </Fields>
}