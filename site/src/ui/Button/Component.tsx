import Loading                 from "ui/Loading/Component"
import styles                  from "./style.module.css"

import { useEffect, useState } from "react"

export const DEFAULT_TYPE  = "regular"
export const DEFAULT_STATE = "active"

export interface Props {
    type?:     ButtonType
    state?:    ButtonState
    onClick?:  OnButtonClick
    children?: any
}

export type ButtonType    = "regular" | "submit"   | "cancel"
export type ButtonState   = "active"  | "disabled" | "loading"
export type OnButtonClick = () => void | Promise<any>

export default function Button(props: Props) {
    const propsState = props.state ?? DEFAULT_STATE

    const [loading, setLoading] = useState(propsState === "loading")

    useEffect(() => setLoading(propsState === "loading"), [propsState])

    const type  = props.type ?? DEFAULT_TYPE
    const state = loading ? "loading" : propsState

    return <button className={className()} type={domType()} disabled={disabled()} onClick={onClick}>
        {loading && <Loading />}

        <div className={styles.children}>
            {props.children}
        </div>
    </button>

    function className(): string {
        const classes = [typeClass(), stateClass(), styles.button]

        return classes.join(" ")

        function typeClass() {
            switch (type) {
                case "regular":
                    return styles.regular

                case "submit":
                    return styles.submit

                case "cancel":
                    return styles.cancel
            }
        }

        function stateClass() {
            switch (state) {
                case "active":
                    return styles.active

                case "disabled":
                    return styles.disabled

                case "loading":
                    return styles.loading
            }
        }
    }

    function domType() {
        return type  === "submit" ? "submit"
                                  : "button"
    }

    function disabled() {
        switch (state) {
            case "disabled":
            case "loading":
                return true

            default:
                return false
        }
    }

    function onClick() {
        if (!props.onClick)
            return

        const result = props.onClick()

        if (result instanceof Promise) {
            setLoading(true)

            result
                .catch(error => console.error(error))
                .finally(()  => setLoading(false))
        }
    }
}