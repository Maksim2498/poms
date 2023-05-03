import iconPath             from "./icon.svg"

import { IconButton       } from "ui/IconButton"
import { BackButtonProps  } from "./types"

export default function BackButton(props: BackButtonProps) {
    return <IconButton src={iconPath} onClick={props.onClick}>Back</IconButton>
}