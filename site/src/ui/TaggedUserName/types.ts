import User               from "logic/User"

import { OnUserTagClick } from "ui/UserTag"

export interface TaggedUserNameProps {
    onTagClick?: OnUserTagClick
    user:        User
}