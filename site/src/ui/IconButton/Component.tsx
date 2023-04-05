import "./style.css"

export interface Props {
    onClick?:  OnIconButtonClick
    children?: string
    src:       string
}

export type OnIconButtonClick = () => void

export default function IconButton(props: Props) {
    const { onClick, children, src } = props

    return <div className="IconButton" style={{backgroundImage: `url("${src}")`}} onClick={onClick}>
        {children}
    </div>
}