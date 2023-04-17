import { Props } from "modules/AuthForm/types"

export type MainProps = MainContentProps
                      | MainAuthProps

export interface MainContentProps {
    show: "content"
}

export interface MainAuthProps extends Props {
    show: "auth"
}

export type ShowMain = "content"
                     | "auth"