import "./style.css"

export interface Props {
    children?: any
}

export default function Error(props: Props) {
    const { children } = props

    if (children == null)
        return null

    return <div className="Error">
        {children}
    </div>
}