import Dim                from "ui/Dim/Component"
import styles             from "./styles.module.css"

import { DimButtonProps } from "./types"

export default function DimButton(props: DimButtonProps) {
    return <div>
        <Dim />
        <div className={styles.button} onClick={props.onClick}>
            {props.children}
        </div>
    </div>
}