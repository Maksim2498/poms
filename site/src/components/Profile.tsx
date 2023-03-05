import User from "logic/User";

import "styles/Profile.css"

export interface Props {
    user: User
}

export default function Profile(props: Props) {
    const { user } = props

    return <div className="Profile">
        <div className="status field">
            <div className="label">Status</div>
            {user.isOnline ? <div className="online value">Online</div>
                           : <div className="offline value">Offline</div>}
        </div>

        <div className="login field">
            <div className="label">Login:</div>
            <div className="value">{user.login}</div>
        </div>

        <div className="name field">
            <div className="label">Name:</div>
            <div className="value">{user.name}</div>
        </div>

        <div className="role field">
            <div className="label">Role:</div>
            {user.isAdmin ? <div className="admin value">Administrator</div>
                          : <div className="user value">User</div>}
        </div>

        <div className="reg field-group">
            <div className="login field">
                <div className="label">Registar:</div>
                {user.reg.login ? <div className="value">{user.reg.login}</div>
                                : <div className="system value">System</div>}
            </div>

            <div className="time field">
                <div className="label">Registration time:</div>
                <div className="value">{user.reg.time.toLocaleString()}</div>
            </div>
        </div>

        { user.nicknames.length !== 0 && <div className="nicknames field">
            <div className="label">Nicknames</div>
            <ul className="value-list">
                {user.nicknames.map(nickname => <li key={nickname} className="value">{nickname}</li>)}
            </ul>
        </div>}
    </div>
}