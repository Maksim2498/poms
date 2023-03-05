import Button  from "./Button"
import User    from "logic/User"
import Console from "./Console"
import Profile from "./Profile"
import Server  from "./Server"
import Users   from "./Users"

import { useState } from "react"

import "styles/UserPanel.css"

export type Props = {
    user: User
}

type Selection = "server"
               | "profile"
               | "users"
               | "console"

export default function UserPanel(props: Props) {
    const [selection, setSelection] = useState("server" as Selection)

    return <div className="UserPanel">
        <ul className="content-selector">
            {contentSelectorItems().map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <div className="content">
            <div className="header">
                {header()}
            </div>
            <div className="main">
                {main()}
            </div>
        </div>
    </div>

    function contentSelectorItems(): JSX.Element[] {
        const items: JSX.Element[] = [
            <Button onClick={() => setSelection("server") }>Server</Button>,
            <Button onClick={() => setSelection("profile")}>Profile</Button>,
            <Button onClick={() => setSelection("users")  }>Users</Button>
        ]

        if (props.user.isAdmin)
            items.push(<Button onClick={() => setSelection("console")}>Console</Button>)

        return items
    }

    function main() {
        switch (selection) {
            case "console":
                return <Console />

            case "profile":
                return <Profile user={props.user}/>

            case "server":
                return <Server />

            case "users":
                return <Users />
        }
    }

    function header() {
        switch (selection) {
            case "console":
                return <h2>Server Console</h2>

            case "profile":
                return <h2>Your Profile</h2>

            case "server":
                return <h2>Server Status</h2>

            case "users":
                return <h2>User List</h2>
        }
    }
}