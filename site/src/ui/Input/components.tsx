import { FormEvent } from "react"

import "./styles.css"

export const DEFAULT_TYPE = "text"

export interface Props {
    type?:        Type
    invalid?:     boolean
    value?:       string
    onChange?:    OnChange
    disabled?:    boolean
    placeholder?: string
    autoFocus?:   boolean
}

export type Type     = "text" | "password"
export type OnChange = (event: FormEvent<HTMLInputElement>) => void

export default function Input(props: Props) {
    const { type, invalid, value, onChange, disabled, placeholder, autoFocus } = props

    const className = invalid ? "error Input" : "Input"

    return <input className   = {className}
                  type        = {type}
                  value       = {value}
                  onChange    = {onChange}
                  disabled    = {disabled}
                  placeholder = {placeholder}
                  autoFocus   = {autoFocus} />
}