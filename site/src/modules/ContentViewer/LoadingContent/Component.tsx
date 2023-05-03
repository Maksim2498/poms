import styles      from "./styles.module.css"

import { Loading } from "ui/Loading"

export default function LoadingContent() {
    return <div className={styles.content}>
        <Loading />
    </div>
}