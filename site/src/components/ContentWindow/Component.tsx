import { Content } from "components/ContentSelector/Component"

import "./style.css"

export interface Props {
    content: Content
}

export default function ContentWindow(props: Props) {
    const { content } = props

    return <div className="ContentWindow">
        <div className="header">
            <h2>{content.name}</h2>
        </div>
        <div className="main">
            {content.component()}
        </div>
    </div>
}