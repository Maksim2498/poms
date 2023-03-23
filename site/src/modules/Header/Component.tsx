import Logo from "./components/Logo/Component"
import User from "./components/User/Component"

import "./style.css"

export default function Header() {
    return <header className="Header">
        <Logo />
        <User />
    </header>
}