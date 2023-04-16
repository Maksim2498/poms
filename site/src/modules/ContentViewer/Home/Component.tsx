import AppearingMessage from "ui/AppearingMessage/Component"
import styles           from "./styles.module.css"

export default function Home() {
    return <div className={styles.home}>
        <AppearingMessage>Welcome to the POMS!</AppearingMessage>
    </div>
}