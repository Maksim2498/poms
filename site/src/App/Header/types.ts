import { OnSignIn } from "App/Header/UserButton"

export type HeaderProps = UserHeaderProps
                        | NoneHeaderProps

export interface HeaderPropsBase {
    show?: HeaderShow
}

export interface UserHeaderProps extends HeaderPropsBase {
    show:     "user"
    onSignIn: OnSignIn
}

export interface NoneHeaderProps extends HeaderPropsBase {
    show?: "none"
}

export type HeaderShow = "user"
                       | "none"