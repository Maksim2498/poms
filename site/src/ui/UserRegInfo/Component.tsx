import { Fields           } from "ui/Fields"
import { UserTag          } from "ui/UserTag"
import { UserRegInfoProps } from "./types"

export default function UserRegInfo(props: UserRegInfoProps) {
    const { login, time } = props.user.reg

    return <Fields header = "Registration Info">
    {{
        Registrar: login != null ? <UserTag login={login} onClick={props.onTagClick} /> : "System",
        Time:      time.toLocaleString()
    }}
    </Fields>
}