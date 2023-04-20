import User         from "logic/User"

import { OnChange } from "logic/User"

export type MaxUserNicknamesContextType = number

export interface UserNicknamesProps {
    editMode?: boolean
    onChange?: OnChange
    user:      User
}