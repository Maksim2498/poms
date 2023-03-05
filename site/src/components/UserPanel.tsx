import Button from "./Button"
import User   from "logic/User"

import { useState } from "react"

import "styles/UserPanel.css"

export type Props = {
    user: User
}

export default function UserPanel(props: Props) {
    const [header, setHeader] = useState("Server")

    return <div className="UserPanel">
        <ul className="content-selector">
            {contentSelectorItems().map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <div className="content">
            <div className="header">
                <h2>{header}</h2>
            </div>
        </div>
    </div>

    function contentSelectorItems(): JSX.Element[] {
        const items: JSX.Element[] = [
            <Button onClick={() => setHeader("Server") }>Server</Button>,
            <Button onClick={() => setHeader("Profile")}>Profile</Button>,
            <Button onClick={() => setHeader("Users")  }>Users</Button>
        ]

        if (props.user.isAdmin)
            items.push(<Button onClick={() => setHeader("Console")}>Console</Button>)

        return items
    }
}