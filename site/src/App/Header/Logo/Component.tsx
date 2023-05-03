import styles                                            from "./styles.module.css"

import { useContext                                    } from "react"
import { ContentStackContext, setContent, HOME_CONTENT } from "modules/ContentViewer"

export default function Logo() {
    const contentStackRef = useContext(ContentStackContext)

    return <h1 className = {styles.Logo}
               onClick   = {() => setContent(contentStackRef, HOME_CONTENT)}>
        POMS
    </h1>
}