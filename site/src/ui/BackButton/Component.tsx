import IconButton            from "ui/IconButton/Component"
import iconPath              from "./icon.svg"

import { OnIconButtonClick } from "ui/IconButton/Component"

export interface Props {
    onClick?: OnIconButtonClick
}

export default function BackButton(props: Props) {
    return <div className="BackButton">
        <IconButton src={iconPath} onClick={props.onClick}>Back</IconButton>
    </div>
}