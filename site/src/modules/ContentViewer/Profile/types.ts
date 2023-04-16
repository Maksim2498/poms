import User from "logic/User"

export type Props = UserProps
                  | LoginProps

export interface UserProps {
    onTagClick?: OnTagClick
    user:        User
}

export interface LoginProps {
    onTagClick?: OnTagClick
    login:       string
}

export type OnTagClick = (newLogin: string, oldLogin: string) => void