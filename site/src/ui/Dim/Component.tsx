import styles       from "./styles.module.css"

import { DimProps } from "./types"

export default function Dim(props: DimProps) {
    return <div className={styles.dim}>
        {props.children}
    </div>
}