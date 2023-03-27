import User                from "logic/User";
import TaggedUserName      from "ui/TaggedUserName/Component";
import UserIcon            from "ui/UserIcon/Component";
import UserOnlineIndicator from "ui/UserOnlineIndicator/Component";
import UserTag             from "ui/UserTag/Component";
import UserNicknames       from "ui/UserNicknames/Component";
import Field               from "ui/Field/Component";

import "./style.css"

export interface Props {
    user: User
}

export default function Profile(props: Props) {
    const { user } = props

    return <div className="Profile">
        <UserIcon            user={user} />
        <TaggedUserName      user={user} />
        <UserOnlineIndicator user={user} />

        <div className="section">
            <h3>Registration info</h3>
            <Field label="Registrar">
                {user.reg.login != null ? <UserTag login={user.reg.login} /> : "System"}
            </Field>
            <Field label="Time">
                {user.reg.time.toLocaleDateString()}
            </Field>
        </div>

        {nicknames()}
    </div>

    function nicknames() {
        if (user.nicknames.length === 0)
            return undefined

        return <div className="section">
            <h3>Nicknames</h3>
            <UserNicknames user={user} />
        </div>
    }
}