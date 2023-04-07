import LoadingIndicator from "ui/LoadingIndicator/Component"
import Dim              from "ui/Dim/Component"
import styles           from  "./styles.module.css"

export default function Loading() {
    return <div className={styles.Loading}>
        <Dim />
        <LoadingIndicator />
    </div>
}