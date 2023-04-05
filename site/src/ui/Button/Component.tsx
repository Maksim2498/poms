import Loading                 from "ui/Loading/Component"

import { useEffect, useState } from "react"

import "./style.css"

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
    const type  = props.type  ?? DEFAULT_TYPE
    const state = props.state ?? DEFAULT_STATE

    const [loading, setLoading] = useState(state === "loading")

    useEffect(() => setLoading(state === "loading"), [state])

    const className = `${type} Button`
    const domType   = type  === "submit" ? "submit" : "button"
    const disabled  = state === "disabled" || loading

    return <button className={className} type={domType} disabled={disabled} onClick={onClick}>
        {loading && <Loading />}

        <div className="children">
            {props.children}
        </div>
    </button>

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