export interface IconButtonProps {
    onClick?:  OnIconButtonClick
    children?: string
    src:       string
}

export type OnIconButtonClick = () => void