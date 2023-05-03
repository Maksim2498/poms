import styles                 from "./styles.module.css"

import { ErrorText          } from "ui/ErrorText"
import { FormErrorTextProps } from "./types"

export default function FormErrorText(props: FormErrorTextProps) {
    const { children: error } = props

    if (error == null)
        return null

    const text = error instanceof Error ? error.message
                                        : String(error)

    const formattedText = text?.replaceAll(/\.\s*/g, ".\n")
                              ?.replaceAll(/\.?$/g,  ".")

    return <div className={styles.text}>
        <ErrorText>
            {formattedText}
        </ErrorText>
    </div>
}