import { OnClick } from "ui/Button/Component"

import "./style.css"

export interface Props {
    onClick?:  OnClick
    children?: string
    src:       string
}

export default function IconButton(props: Props) {
    const { onClick, children, src } = props

    return <div className="IconButton" style={{backgroundImage: `url("${src}")`}} onClick={onClick}>
        {children}
    </div>
}