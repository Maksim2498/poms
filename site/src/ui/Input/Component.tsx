import { FormEvent } from "react"

import "./styles.css"

export const DEFAULT_TYPE = "text"

export interface Props {
    type?:        InputType
    invalid?:     boolean
    value?:       string
    onChange?:    OnInputChange
    disabled?:    boolean
    placeholder?: string
    autoFocus?:   boolean
}

export type InputType     = "text" | "password"
export type OnInputChange = (value: string) => void

export default function Input(props: Props) {
    const { type, invalid, value, onChange, disabled, placeholder, autoFocus } = props

    const className = invalid ? "error Input" : "Input"

    return <input className   = {className}
                  type        = {type}
                  value       = {value}
                  onChange    = {rawOnChange}
                  disabled    = {disabled}
                  placeholder = {placeholder}
                  autoFocus   = {autoFocus} />

    function rawOnChange(event: FormEvent<HTMLInputElement>) {
        if (!onChange)
            return

        const value = event.currentTarget.value

        onChange(value)
    }
}