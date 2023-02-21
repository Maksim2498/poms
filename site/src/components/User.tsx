import "styles/User.css"

import Button from "./Button"

export type Props = {
    name:       string
    onSignOut?: () => void
} | {
    onSignIn?: () => void
}

export default function User(props: Props) {
    if ("name" in props)
        return <div className="signed-in User">
            <div className="name">{props.name}</div>
            <Button onClick={props.onSignOut} type="cancel">Sign Out</Button>
        </div>

    return <div className="not-signed-in User">
        <Button onClick={props.onSignIn} type="submit">Sign In</Button>
    </div>
}