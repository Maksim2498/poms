import IconButton from "ui/IconButton/Component"
import iconPath   from "./icon.svg"

import { Props  } from "./types"

export default function BackButton(props: Props) {
    return <IconButton src={iconPath} onClick={props.onClick}>Back</IconButton>
}