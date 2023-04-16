export interface Props {
    onClick?:  OnIconButtonClick
    children?: string
    src:       string
}

export type OnIconButtonClick = () => void