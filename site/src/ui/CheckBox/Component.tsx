import { FormEvent     } from "react"
import { CheckBoxProps } from "./type"

export default function CheckBox(props: CheckBoxProps) {
    const {
        checked,
        onChange,
        disabled,
        autoFocus,
        autoComplete,
        label
    } = props

    return <>
        {label != null && <label>{label}</label>}
        <input checked      = {checked}
               onChange     = {rawOnChange}
               disabled     = {disabled}
               autoFocus    = {autoFocus}
               autoComplete = {autoComplete}
               type         = "checkbox" />
    </>

    function rawOnChange(event: FormEvent<HTMLInputElement>) {
        onChange?.(event.currentTarget.checked)
    }
}