import UserName                from "ui/UserName/Component";
import UserTag                 from "ui/UserTag/Component";

import { TaggedUserNameProps } from "./types"

export default function TaggedUserName(props: TaggedUserNameProps) {
    const { user, onTagClick } = props

    return <>
        <UserName user={user} />
        <UserTag  user={user} onClick={onTagClick} />
    </>
}