import styles            from "./styles.module.css"

import { AuthForm      } from "modules/AuthForm"
import { ContentViewer } from "modules/ContentViewer"
import { MainProps     } from "./types"

export default function Main(props: MainProps) {
    return <main className={styles.main}>
        {body()}
    </main>

    function body() {
        switch (props.show) {
            case "auth":
                return <AuthForm onAuth={props.onAuth} onCancel={props.onCancel} />

            case "content":
                return <ContentViewer />
        }
    }
}