import defaultIconSrc from "./default-icon.png"
import styles         from "./styles.module.css"

import { Props      } from "./types"

export default function ServerIcon(props: Props) {
    const { server } = props
    const src        = server.favicon ?? defaultIconSrc

    return <img className={styles.icon} src={src} alt="Server icon" />
}