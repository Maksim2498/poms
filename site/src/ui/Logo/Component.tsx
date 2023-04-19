import styles        from "./styles.module.css"

import { LogoProps } from "./types"

export default function Logo(props: LogoProps) {
    return <h1 className={styles.Logo} onClick={props.onClick}>POMS</h1>
}