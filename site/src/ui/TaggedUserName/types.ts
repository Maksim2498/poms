import User               from "logic/User"

import { OnUserTagClick } from "ui/UserTag/Component"

export interface Props {
    onTagClick?: OnUserTagClick
    user:        User
}