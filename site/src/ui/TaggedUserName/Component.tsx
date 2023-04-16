import User               from "logic/User";
import UserName           from "ui/UserName/Component";
import UserTag            from "ui/UserTag/Component";

import { OnUserTagClick } from "ui/UserTag/Component";

export interface Props {
    onTagClick?: OnUserTagClick
    user:        User
}

export default function TaggedUserName(props: Props) {
    const { user, onTagClick } = props

    return <>
        <UserName user={user} />
        <UserTag  user={user} onClick={onTagClick} />
    </>
}