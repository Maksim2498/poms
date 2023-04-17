import User from "logic/User"

export type ProfileProps = ProfileUserProps
                         | ProfileLoginProps

export interface ProfileUserProps {
    onTagClick?: OnProfileTagClick
    user:        User
}

export interface ProfileLoginProps {
    onTagClick?: OnProfileTagClick
    login:       string
}

export type OnProfileTagClick = (newLogin: string, oldLogin: string) => void