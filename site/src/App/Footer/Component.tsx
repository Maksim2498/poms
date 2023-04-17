import GitHub from "ui/GitHub/Component"
import styles from "./styles.module.css"

export default function Footer() {
    return <footer className={styles.footer}>
        <GitHub />
    </footer>
}