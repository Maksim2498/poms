import styles                    from  "./styles.module.css"

import { FormEvent, forwardRef } from "react"
import { Props                 } from "./types"

export const DEFAULT_TYPE = "text"

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
        onKeyUp,
        autoComplete
    } = props

    const className = invalid ? styles.invalid : styles.valid

    return <input className    = {className}
                  onKeyDown    = {onKeyDown}
                  onKeyUp      = {onKeyUp}
                  type         = {type}
                  value        = {value}
                  onChange     = {rawOnChange}
                  disabled     = {disabled}
                  placeholder  = {placeholder}
                  autoFocus    = {autoFocus}
                  autoComplete = {autoComplete}
                  ref          = {ref} />

    function rawOnChange(event: FormEvent<HTMLInputElement>) {
        if (!onChange)
            return

        const value = event.currentTarget.value

        onChange(value)
    }
})

export default Input