import styles               from  "./styles.module.css"

import { LoadingIndicator } from "ui/LoadingIndicator"
import { Dim              } from "ui/Dim"

export default function Loading() {
    return <div className={styles.loading}>
        <Dim />
        <LoadingIndicator />
    </div>
}