import "./style.css"

import User from "components/User/component"

export type Props = {} | {
    show: "sign-in"
} | {
    show:     "user"
    login:    string
    isAdmin?: boolean
}

export default function Header(props: Props) {
    return <header className="Header">
        <div className="logo">POMS</div>
        {component()}
    </header>

    function component() {
        if (!("show" in props))
            return <div></div>

        switch (props.show) {
            case "sign-in":
                return <User />

            case "user":
                return <User user={props} />
        }
    }
}