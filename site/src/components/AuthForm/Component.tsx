import AuthInfo from "logic/AuthInfo"
import Input    from "ui/Input/Components"
import Button   from "ui/Button/Component"

import "./style.css"

export interface Props {
    onAuth?: OnAuth
}

export type OnAuth = (authInfo: AuthInfo) => void

export default function AuthFrom(props: Props) {
    return <form className="AuthForm">
        <Input placeholder="Login" />
        <Input placeholder="Password" type="password" />
        <Button type="cancel">Cancel</Button>
        <Button type="submit">Sign In</Button>
    </form>
}