import styles                    from "./styles.module.css"

import { ChangeEvent, useState } from "react"
import { DEFAULT_LABEL         } from "./constants"
import { FileInputProps        } from "./types"

export default function FileInput(props: FileInputProps) {
    const {
        accept,
        disabled,
        autoFocus,
        multiple,
        onChange,
        children
    } = props

    const propsLabel = children ?? DEFAULT_LABEL

    const [label, setLabel] = useState(propsLabel)

    const id = Math.random().toFixed()

    return <div className={disabled ? styles.disabledContainer : styles.container}>
        <input className   = {styles.input}
               id          = {id}
               type        = "file"
               multiple    = {multiple}
               onChange    = {rawOnChange}
               disabled    = {disabled}
               autoFocus   = {autoFocus}
               accept      = {accept} />

        {
            label != null && <label htmlFor={id} className={styles.label}>
                {label}
            </label>
        }
    </div>

    function rawOnChange(event: ChangeEvent<HTMLInputElement>) {
        const { files } = event.target

        onChange?.(files)

        if (files == null || files.length === 0) {
            setLabel(propsLabel)
            return
        }

        let filePaths = [] as string[]

        for (let i = 0; i < files.length; ++i) {
            const file = files.item(i)

            if (file == null)
                continue

            filePaths.push(file.name)
        }

        const newLabel = filePaths.join(", ")

        setLabel(newLabel)
    }
}