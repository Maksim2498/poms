import "./style.css"

export interface Props {
    label:    any
    children: any
}

export default function Field(props: Props) {
    const { label, children } = props

    return <div className="Field">
        <div className="label">{label}: </div>
        <div className="value">{children}</div>
    </div>
}