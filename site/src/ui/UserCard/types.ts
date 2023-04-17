import User from "logic/User"

export interface UserCardProps {
    onClick?: OnUserCardClick
    user:     User
}

export type OnUserCardClick = (user: User) => void