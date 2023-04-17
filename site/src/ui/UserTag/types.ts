import User from "logic/User"

export type UserTagProps = UserProps
                         | LoginProps

export interface UserProps {
    onClick?: OnUserTagClick
    user:     User
}

export interface LoginProps {
    onClick?: OnUserTagClick
    login:    string
}

export type OnUserTagClick = (login: string) => void