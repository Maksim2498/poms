import User from "logic/User"

export interface UserIconProps {
    onClick?: OnUserIconClick
    user?:    User
}

export type OnUserIconClick = (user?: User) => void