import UserName  from "ui/UserName/Component";
import UserTag   from "ui/UserTag/Component";

import { Props } from "./types"

export default function TaggedUserName(props: Props) {
    const { user, onTagClick } = props

    return <>
        <UserName user={user} />
        <UserTag  user={user} onClick={onTagClick} />
    </>
}