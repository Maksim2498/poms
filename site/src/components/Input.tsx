import { FormEvent } from "react"

import "styles/Input.css"

export type Props = {
    type:         "text" | "password" | "submit"
    invalid?:     boolean
    value?:       string
    onChange?:    (event: FormEvent<HTMLInputElement>) => void
    disabled?:    boolean
    placeholder?: string
    autofocus?:   boolean
}

export default function Input(props: Props) {
    return <input className   = {props.invalid ? "error Input" : "Input"}
                  type        = {props.type}
                  value       = {props.value}
                  onChange    = {props.onChange}
                  disabled    = {props.disabled}
                  placeholder = {props.placeholder}
                  autoFocus   = {props.autofocus} />
}