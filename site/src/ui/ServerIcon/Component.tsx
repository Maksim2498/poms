import Server         from "logic/Server"
import defaultIconSrc from "./default-icon.png"
import styles         from "./styles.module.css"

export interface Props {
    server: Server
}

export default function ServerIcon(props: Props) {
    const { server } = props
    const src        = server.favicon ?? defaultIconSrc

    return <img className={styles.icon} src={src} alt="Server icon" />
}