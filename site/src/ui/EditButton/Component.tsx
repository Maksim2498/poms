import IconButton  from "ui/IconButton/Component"
import iconPath    from "./icon.svg"

import { OnClick } from "ui/Button/Component"

export interface Props {
    onClick?: OnClick
}

export default function EditButton(props: Props) {
    return <div className="EditButton">
        <IconButton src={iconPath} onClick={props.onClick}>Edit</IconButton>
    </div>
}