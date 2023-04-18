import Loading from "ui/Loading/Component";
import styles  from "./styles.module.css"

export default function LoadingContent() {
    return <div className={styles.content}>
        <Loading />
    </div>
}