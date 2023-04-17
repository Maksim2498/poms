import IconButton           from "ui/IconButton/Component"
import iconPath             from "./icon.svg"

import { BackButtonProps  } from "./types"

export default function BackButton(props: BackButtonProps) {
    return <IconButton src={iconPath} onClick={props.onClick}>Back</IconButton>
}