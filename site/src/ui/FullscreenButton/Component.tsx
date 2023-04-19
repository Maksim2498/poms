import IconButton from "ui/IconButton/Component"
import iconPath   from "./icon.svg"

export default function FullscreenButton() {
    return <IconButton src={iconPath} onClick={onClick}>Toggle fullscreen</IconButton>

    function onClick() {
        const doc = document as any

        if (!(document.fullscreenElement ?? doc.webkitFullscreenElement))
            document.body.requestFullscreen?.() ?? doc.body.webkitRequestFullscreen?.()
        else
            document.exitFullscreen?.() ?? doc.webkitExitFullscreen()
    }
}