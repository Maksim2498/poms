import "./style.css"

export interface Props {
    children?: any
}

export default function ErrorText(props: Props) {
    const { children } = props

    if (!children)
        return null

    return <div className="ErrorText">
        {children}
    </div>
}