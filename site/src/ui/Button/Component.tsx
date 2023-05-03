import styles                                        from "./style.module.css"

import { useEffect, useState                       } from "react"
import { Loading                                   } from "ui/Loading"
import { DEFAULT_BUTTON_COLOR, DEFAULT_BUTTON_TYPE } from "./constants"
import { ButtonProps                               } from "./types"

export default function Button(props: ButtonProps) {
    const {
        disabled,
        loading,
        onClick,
        children,
        autoFocus
    } = props

    const color = props.color ?? DEFAULT_BUTTON_COLOR
    const type  = props.type  ?? DEFAULT_BUTTON_TYPE

    const [innerLoading, setInnerLoading] = useState(loading)

    useEffect(() => setInnerLoading(loading), [loading])

    return <button className={className()} type={domType()} disabled={disabled} onClick={rawOnClick} autoFocus={autoFocus}>
        {innerLoading && <Loading />}

        <div className={styles.children}>
            {children}
        </div>
    </button>

    function className(): string {
        const classes = [colorClass(), stateClass(), styles.button]

        return classes.join(" ")

        function colorClass() {
            return styles[color]
        }

        function stateClass() {
            if (innerLoading)
                return styles.loading

            if (disabled)
                return styles.disabled

            return styles.active
        }
    }

    function domType(): "button" | "reset" | "submit" {
        switch (type) {
            case "reset":
            case "submit":
                return type

            default:
                return "button"
        }
    }

    function rawOnClick() {
        const result = onClick?.()

        if (result instanceof Promise) {
            setInnerLoading(true)

            result.catch(error => console.error(error))
                  .finally(()  => setInnerLoading(false))
        }
    }
}