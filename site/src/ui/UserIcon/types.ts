import User from "logic/User"

export interface Props {
    onClick?: OnUserIconClick
    user?:    User
}

export type OnUserIconClick = (user?: User) => void