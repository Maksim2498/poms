import Button from "./Button"

import "styles/UserPanel.css"

export type Props = {
    isAdmin?: boolean
}

export default function UserPanel(props: Props) {
    return <div className="UserPanel">
        <ul className="content-selector">
            {contentSelectorItems().map((item, i) => <li key={i}>{item}</li>)}
        </ul>
        <div className="content">

        </div>
    </div>

    function contentSelectorItems(): JSX.Element[] {
        const items: JSX.Element[] = [
            <Button>Profile</Button>
        ]

        if (!props.isAdmin)
            return items

        return [
            ...items,
            <Button>Users</Button>,
            <Button>Console</Button>
        ]
    }
}