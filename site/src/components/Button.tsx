import "styles/Button.css"

export const DEFAULT_TYPE = "regular"

export type Props = {
    type?:     "regular" | "submit" | "cancel"
    onClick?:  () => void
    children?: any
    disabled?: boolean
}

export default function Button(props: Props) {
    const type = props.type ?? DEFAULT_TYPE

    return <button className = {`${type} Button`                             }
                   type      = {props.type === "submit" ? "submit" : "button"}
                   onClick   = {props.onClick                                }
                   disabled  = {props.disabled                               }>
        {props.children}
    </button>
}