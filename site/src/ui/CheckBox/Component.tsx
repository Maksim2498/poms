import styles            from "./styles.module.css"

import { FormEvent     } from "react"
import { CheckBoxProps } from "./type"

export default function CheckBox(props: CheckBoxProps) {
    const {
        checked,
        onChange,
        disabled,
        autoFocus,
        autoComplete,
        children: label
    } = props

    return <div className={styles.checkBox}>
        {label != null && <label>{label}</label>}
        <input checked      = {checked}
               onChange     = {rawOnChange}
               disabled     = {disabled}
               autoFocus    = {autoFocus}
               autoComplete = {autoComplete}
               type         = "checkbox" />
    </div>

    function rawOnChange(event: FormEvent<HTMLInputElement>) {
        onChange?.(event.currentTarget.checked)
    }
}