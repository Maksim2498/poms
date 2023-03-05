import Loading from "./Loading"

import "styles/Button.css"

export const DEFAULT_TYPE  = "regular"
export const DEFAULT_STATE = "active"

export type Props = {
    type?:     Type
    state?:    State
    onClick?:  () => void
    children?: any
}

export type Type  = "regular" | "submit"   | "cancel"
export type State = "active"  | "disabled" | "loading"

export default function Button(props: Props) {
    const type  = props.type  ?? DEFAULT_TYPE
    const state = props.state ?? DEFAULT_STATE

    return <button className = {`${type} Button`                             }
                   type      = {props.type === "submit" ? "submit" : "button"}
                   onClick   = {props.onClick                                }
                   disabled  = {state === "disabled" || state === "loading"  }>
        {state === "loading" && <Loading />}

        <div className="children">
            {props.children}
        </div>
    </button>
}