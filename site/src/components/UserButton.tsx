import User   from "logic/User"
import Button from "./Button"

import { State } from "./Button"

import "styles/UserButton.css"

export type Props = {
    user:     User
    onClick?: () => void
    state?:   State
} | {
    onClick?: () => void
    state?:   State
}

export default function UserController(props: Props) {
    if ("user" in props)
        return <div className="signed-in UserButton">
            <div className="name">{props.user.name ?? props.user.login}</div>
            <Button onClick={props.onClick} type="cancel" state={props.state}>
                Sign Out
            </Button>
        </div>

    return <div className="not-signed-in UserButton">
        <Button onClick={props.onClick} type="submit" state={props.state}>
            Sign In
        </Button>
    </div>
}