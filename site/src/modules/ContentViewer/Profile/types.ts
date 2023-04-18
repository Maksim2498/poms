import User from "logic/User"

export type ProfileProps = ProfileUserProps
                         | ProfileLoginProps

export interface ProfilePropsBase {
    onTagClick?: OnProfileTagClick
    editMode?:   boolean
}

export interface ProfileUserProps extends ProfilePropsBase {
    user: User
}

export interface ProfileLoginProps extends ProfilePropsBase {
    login: string
}

export type OnProfileTagClick = (newLogin: string, oldLogin: string) => void