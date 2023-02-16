import "./style.css"

export default function Header() {
    return <header className="Header">
        <div className="logo">POMS</div>
        <div className="right">
            <button className="sign-in">Sign In</button>
            <a href="https://github.com/Maksim2498/poms" className="github">GitHub</a>
        </div>
    </header>
}