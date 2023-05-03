import styles               from "./styles.module.css"

import { AppearingMessage } from "ui/AppearingMessage"

export default function Home() {
    return <div className={styles.home}>
        <AppearingMessage>Welcome to the POMS!</AppearingMessage>
    </div>
}