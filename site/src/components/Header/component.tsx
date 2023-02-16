import "./style.css"

import User from "components/User/component"

export default function Header() {
    return <header className="Header">
        <div className="logo">POMS</div>
        <User />
    </header>
}