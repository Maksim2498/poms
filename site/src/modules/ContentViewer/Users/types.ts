import { OnUserCardClick } from "ui/UserCard/types"

export interface UsersProps {
    onUserClick?: OnUserCardClick
    editMode?:    boolean
}