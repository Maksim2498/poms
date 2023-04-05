import "./style.css"

export interface Props {
    label:    any
    children: any
}

export default function Field(props: Props) {
    const { label, children } = props

    return <div className="Field">
        <span className="label">{label}: </span>
        <span className="value">{children}</span>
    </div>
}