import User         from "logic/User"

import { OnChange } from "logic/User"

export interface UserNameProps {
    editMode?: boolean
    user:      User
    onChange?: OnChange
}