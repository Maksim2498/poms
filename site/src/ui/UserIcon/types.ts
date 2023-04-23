import User         from "logic/User"

import { OnChange } from "logic/User"

export interface UserIconProps {
    editMode?: boolean
    onClick?:  OnUserIconClick
    user?:     User
    onChange?: OnChange
}

export type OnUserIconClick = (user?: User) => void