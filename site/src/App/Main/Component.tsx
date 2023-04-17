import AuthFrom            from "modules/AuthForm/Component"
import ContentViewer       from "modules/ContentViewer/Component"
import styles              from "./styles.module.css"

import { MainProps       } from "./types"

export default function Main(props: MainProps) {
    return <main className={styles.main}>
        {body()}
    </main>

    function body() {
        switch (props.show) {
            case "auth":
                return <AuthFrom onAuth={props.onAuth} onCancel={props.onCancel} />

            case "content":
                return <ContentViewer />
        }
    }
}