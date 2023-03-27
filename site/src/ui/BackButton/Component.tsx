import IconButton  from "ui/IconButton/Component"
import iconPath    from "./icon.svg"

import { OnClick } from "ui/Button/Component"

export interface Props {
    onClick?: OnClick
}

export default function BackButton(props: Props) {
    return <div className="BackButton">
        <IconButton src={iconPath} onClick={props.onClick}>Back</IconButton>
    </div>
}