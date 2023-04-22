import styles                 from "./styles.module.css"

import { ServerAddressProps } from "./types";

export default function ServerAddress(props: ServerAddressProps) {
    return <div>
        Address: <span className={styles.address}>{props.server.address}</span>
    </div>
}