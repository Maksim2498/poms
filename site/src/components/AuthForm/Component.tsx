import AuthInfo from "logic/AuthInfo"

import "./style.css"

export interface Props {
    onAuth?: OnAuth
}

export type OnAuth = (authInfo: AuthInfo) => void

export default function AuthFrom(props: Props) {
    return <form className="AuthForm">
        Auth...
    </form>
}