import styles               from "./styles.module.css"

import { DEFAULT_DIM_TYPE } from "./constants"
import { DimProps         } from "./types"

export default function Dim(props: DimProps) {
    const type = props.type ?? DEFAULT_DIM_TYPE

    return <div className={type === "dark" ? styles.dark : styles.light}>
        {props.children}
    </div>
}