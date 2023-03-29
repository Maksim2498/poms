import Server         from "logic/Server"
import defaultIconSrc from "./default-icon.png"

import "./style.css"

export interface Props {
    server: Server
}

export default function ServerIcon(props: Props) {
    const { server } = props
    const src        = server.favicon ?? defaultIconSrc

    return <img className="ServerIcon" src={src} alt="Server icon" />
}