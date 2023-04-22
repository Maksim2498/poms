import styles                 from "./styles.module.css"

import { ServerAddressProps } from "./types";

export default function ServerAddress(props: ServerAddressProps) {
    const { address } = props.server

    if (address == null)
        return null

    return <div>
        Address:
        <span className={styles.address} hover-text="Copy" onClick={() => navigator.clipboard.writeText(address)}>
            {address}
        </span>
    </div>
}