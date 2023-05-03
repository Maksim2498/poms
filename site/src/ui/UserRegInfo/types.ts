import User               from "logic/User"

import { OnUserTagClick } from "ui/UserTag"

export interface UserRegInfoProps {
    onTagClick?: OnUserTagClick
    user:        User
}