import Logo       from "./children/Logo/Component"
import UserButton from "./children/UserButton/Component"

import { Props  } from "./children/UserButton/Component"

import "./style.css"

export default function Header(props: Props) {
    return <header className="Header">
        <Logo />
        <UserButton {...props} />
    </header>
}