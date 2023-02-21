import "styles/Button.css"

export const DEFAULT_TYPE = "regular"

export type Props = {
    type?:     "regular" | "submit" | "cancel"
    onClick?:  () => void
    children?: any
    disabled?: boolean
}

export default function Button(props: Props) {
    return <button className = {`${props.type ?? DEFAULT_TYPE} Button`}
                   onClick   = {props.onClick}
                   disabled  = {props.disabled}>
        {props.children}
    </button>
}