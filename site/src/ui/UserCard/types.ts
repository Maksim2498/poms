import User from "logic/User"

export interface Props {
    onClick?: OnUserCardClick
    user:     User
}

export type OnUserCardClick = (user: User) => void