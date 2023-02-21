import "styles/Button.css"

export const DEFAULT_TYPE = "regular"

export type Props = {
    children?:  any
    onClick?:   () => void
    type?:      "regular" | "submit" | "cancel"
    disabled?:  boolean
    makeInput?: boolean
}

export default function Button(props: Props) {
    const className = `${props.type ?? DEFAULT_TYPE} Button`

    if (props.makeInput)
        return <input className = {className}
                      type      = "submit"
                      onClick   = {props.onClick}
                      value     = {props.children}
                      disabled  = {props.disabled} />

    return <button className = {className}
                   onClick   = {props.onClick}
                   disabled  = {props.disabled}>
        {props.children}
    </button>
}