import { UserName            } from "ui/UserName"
import { UserTag             } from "ui/UserTag"
import { TaggedUserNameProps } from "./types"

export default function TaggedUserName(props: TaggedUserNameProps) {
    const { user, onTagClick } = props

    return <>
        <UserName user={user} />
        <UserTag  user={user} onClick={onTagClick} />
    </>
}