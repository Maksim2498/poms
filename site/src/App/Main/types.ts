import { Props as AProps } from "modules/AuthForm/types"

export type Props = ContentProps
                  | AuthProps

export interface ContentProps {
    show: "content"
}

export interface AuthProps extends AProps {
    show: "auth"
}

export type Show = "content"
                 | "auth"