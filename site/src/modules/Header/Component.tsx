import Logo       from "./components/Logo/Component"
import UserButton from "./components/UserButton/Component"

import { Props } from "./components/UserButton/Component"

import "./style.css"

export default function Header(props: Props) {
    return <header className="Header">
        <Logo />
        <UserButton {...props} />
    </header>
}