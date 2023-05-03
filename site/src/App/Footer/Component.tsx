import styles               from "./styles.module.css"

import { FullscreenButton } from "ui/FullscreenButton"
import { GitHub           } from "ui/GitHub"

export default function Footer() {
    return <footer className={styles.footer}>
        <div className={styles.fullscreen}>
            <FullscreenButton />
        </div>

        <div className={styles.github}>
            <GitHub />
        </div>
    </footer>
}