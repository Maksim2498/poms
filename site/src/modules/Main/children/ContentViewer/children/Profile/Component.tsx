import useAsync            from "hooks/useAsync";
import User                from "logic/User";
import TaggedUserName      from "ui/TaggedUserName/Component";
import UserIcon            from "ui/UserIcon/Component";
import UserOnlineIndicator from "ui/UserOnlineIndicator/Component";
import UserTag             from "ui/UserTag/Component";
import UserNicknames       from "ui/UserNicknames/Component";
import Field               from "ui/Field/Component";
import Loading             from "ui/Loading/Component";
import ErrorText           from "ui/ErrorText/Component";

import { OnUserTagClick  } from "ui/UserTag/Component";

import "./style.css"

export type Props = UserProps
                  | LoginProps

export interface UserProps {
    onUserTagClick?: OnUserTagClick
    user:            User
}

export interface LoginProps {
    onUserTagClick?: OnUserTagClick
    login:           string
}

export default function Profile(props: Props) {
    const [user, loading, error] = useAsync(getUser)
    const { onUserTagClick     } = props
    const className              = "Profile"

    if (loading)
        return <div className={className}>
            <Loading />
        </div>

    if (error != null)
        return <div className={className}>
            <ErrorText>{error}</ErrorText>
        </div>

    return <div className={className}>
        <UserIcon            user={user!} />
        <TaggedUserName      user={user!} onTagClick={onUserTagClick} />
        <UserOnlineIndicator user={user!} />

        <div className="section">
            <h3>Registration info</h3>
            <Field label="Registrar">
                {user!.reg.login != null ? <UserTag login={user!.reg.login} onClick={onUserTagClick} /> : "System"}
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

        return new User({ login: props.login })
    }

    function nicknames() {
        if (user!.nicknames.length === 0)
            return undefined

        return <div className="section">
            <h3>Nicknames</h3>
            <UserNicknames user={user!} />
        </div>
    }
}