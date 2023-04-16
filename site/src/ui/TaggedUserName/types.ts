import User               from "logic/User"

import { OnUserTagClick } from "ui/UserTag/types"

export interface Props {
    onTagClick?: OnUserTagClick
    user:        User
}