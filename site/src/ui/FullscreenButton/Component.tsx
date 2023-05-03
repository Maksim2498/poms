import iconPath       from "./icon.svg"

import { IconButton } from "ui/IconButton"

export default function FullscreenButton() {
    return <IconButton src={iconPath} onClick={onClick}>Toggle fullscreen</IconButton>

    function onClick() {
        const doc = document as any

        if (!(document.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.mozFullScreenElement))
            document.body.requestFullscreen?.() ?? doc.body.webkitRequestFullscreen?.() ?? doc.body.mozRequestFullScreen?.()
        else
            document.exitFullscreen?.() ?? doc.webkitExitFullscreen() ?? doc.mozExitFullScreen?.()
    }
}