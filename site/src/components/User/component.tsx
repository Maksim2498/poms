import "./style.css"

export interface Props {
    user?: {
        login:    string
        isAdmin?: boolean
    }
}

export default function User(props: Props) {
    if (props.user == null) 
        return <div className="User">
            <button className="sign-in">Sign In</button>
        </div>
                                
    return <div className="User">
        <div className="login">{props.user.login}</div>
        <ul className="actions">
            {props.user.isAdmin && <li><button className="admin-panel">Admin Panel</button></li>}
            <li><button className="options">Options</button></li>
            <li><button className="sign-out">Sign Out</button></li>
        </ul>
    </div>
}