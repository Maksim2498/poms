import FullscreenButton from "ui/FullscreenButton/Component"
import GitHub           from "ui/GitHub/Component"
import styles           from "./styles.module.css"

export default function Footer() {
    return <footer className={styles.footer}>
        <div className={styles.fullscreen}>
            <FullscreenButton />
        </div>
        <GitHub />
    </footer>
}