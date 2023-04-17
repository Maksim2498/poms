import { OnSignIn } from "components/UserButton/types"

export type HeaderProps = HeaderUserProps
                        | HeaderNoneProps

export interface HeaderUserProps {
    show:     "user"
    onSignIn: OnSignIn
}

export interface HeaderNoneProps {
    show?: "none"
}

export type HeaderShow = "user"
                       | "none"