import { AuthProps } from "modules/AuthForm/types"

export type MainProps = MainContentProps
                      | MainAuthProps

export interface MainContentProps {
    show: "content"
}

export interface MainAuthProps extends AuthProps {
    show: "auth"
}

export type ShowMain = "content"
                     | "auth"