import ContentStackContext from "modules/ContentViewer/Context"
import styles              from "./styles.module.css"

import { useContext      } from "react"
import { HOME_CONTENT    } from "modules/ContentViewer/constants"
import { LogoProps       } from "./types"

export default function Logo(props: LogoProps) {
    const [, setContentStack] = useContext(ContentStackContext)

    return <h1 className = {styles.Logo}
               onClick   = {() => setContentStack([HOME_CONTENT])}>
        POMS
    </h1>
}