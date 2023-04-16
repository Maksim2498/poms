import { OnSignIn } from "components/UserButton/types"

export type Props = UserProps
                  | NoneProps

export interface UserProps {
    show:     "user"
    onSignIn: OnSignIn
}

export interface NoneProps {
    show?: "none"
}

export type Show = "user" | "none"