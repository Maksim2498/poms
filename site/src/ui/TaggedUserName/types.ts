import User               from "logic/User"

import { OnUserTagClick } from "ui/UserTag/types"

export interface TaggedUserNameProps {
    onTagClick?: OnUserTagClick
    user:        User
}