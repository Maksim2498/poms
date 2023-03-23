import User     from "logic/User"
import UserName from "ui/UserName/Component"
import Button   from "ui/Button/Component"

import "./style.css"

export type Props = NoneProps
                  | NotSignedInProps
                  | SignedInProps

export interface NoneProps {
    show?: "none"
}

export interface NotSignedInProps {
    show:      "not-signed-in"
    onSignIn?: OnSignIn
}

export interface SignedInProps {
    show: "signed-in"
    user: User
}

export type Show      = "signed-in" | "not-signed-in" | "none"
export type OnSignIn  = () => void
export type OnSignOut = () => Promise<void>

export default function UserButton(props: Props) {
    return <div className="UserButton">
        {show()}
    </div>

    function show() {
        switch (props.show) {
            case undefined:
            case "none":
                return none(props)

            case "signed-in":
                return signedIn(props)

            case "not-signed-in":
                return notSignedIn(props)
        }
    }

    function none(props: NoneProps): JSX.Element {
        return <div className="none" />
    }

    function signedIn(props: SignedInProps) {
        return <div className="signed-in">
            <UserName user={props.user} />
            <Button type="cancel">Sign Out</Button>
        </div>
    }

    function notSignedIn(props: NotSignedInProps) {
        return <div className="not-signed-in">
            <Button type="submit" onClick={props.onSignIn}>Sign In</Button>
        </div>
    }
}