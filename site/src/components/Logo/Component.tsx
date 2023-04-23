import ContentStackContext from "modules/ContentViewer/Context"
import styles              from "./styles.module.css"

import { useContext      } from "react"
import { setHomeContent  } from "modules/ContentViewer/util"
import { LogoProps       } from "./types"

export default function Logo(props: LogoProps) {
    const contentStackContext = useContext(ContentStackContext)

    return <h1 className = {styles.Logo}
               onClick   = {() => setHomeContent(contentStackContext)}>
        POMS
    </h1>
}