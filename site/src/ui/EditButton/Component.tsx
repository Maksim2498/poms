import IconButton           from "ui/IconButton/Component"
import iconPath             from "./icon.svg"

import { EditButtonProps  } from "./types"

export default function EditButton(props: EditButtonProps) {
    return <IconButton src={iconPath} onClick={props.onClick}>Edit</IconButton>
}