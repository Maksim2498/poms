import defaultIconSrc      from "./default-icon.png"
import styles              from "./styles.module.css"

import { ServerIconProps } from "./types"

export default function ServerIcon(props: ServerIconProps) {
    const { server } = props
    const src        = server.favicon ?? defaultIconSrc

    return <img className={styles.icon} src={src} alt="Server icon" />
}