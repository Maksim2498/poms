import { FormEvent, RefObject, forwardRef } from "react"

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
    onKeyDown?:   OnInputKeyEvent
    onKeyUp?:     OnInputKeyEvent
}

export type InputType       = "text" | "password"
export type OnInputChange   = (value: string) => void
export type OnInputKeyEvent = (event: InputKeyEvent) => void
export type InputElementRef = RefObject<HTMLInputElement>

export interface InputKeyEvent {
    altKey:   boolean
    ctrlKey:  boolean
    code:     string
    key:      string
    locale:   string
    location: number
    metaKey:  boolean
    repeat:   boolean
    shiftKey: boolean

    preventDefault(): void;
    isDefaultPrevented(): boolean;
}

const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
    const {
        type,
        invalid,
        value,
        onChange,
        disabled,
        placeholder,
        autoFocus,
        onKeyDown,
        onKeyUp
    } = props

    const className = invalid ? "error Input" : "Input"

    return <input className   = {className}
                  onKeyDown   = {onKeyDown}
                  onKeyUp     = {onKeyUp}
                  type        = {type}
                  value       = {value}
                  onChange    = {rawOnChange}
                  disabled    = {disabled}
                  placeholder = {placeholder}
                  autoFocus   = {autoFocus}
                  ref         = {ref} />

    function rawOnChange(event: FormEvent<HTMLInputElement>) {
        if (!onChange)
            return

        const value = event.currentTarget.value

        onChange(value)
    }
})

export default Input