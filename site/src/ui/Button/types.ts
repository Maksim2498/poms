export interface ButtonProps {
    type?:      ButtonType
    color?:     ButtonColor
    disabled?:  boolean
    loading?:   boolean
    onClick?:   OnButtonClick
    autoFocus?: boolean
    children?:  any
}

export type ButtonType    = "regular" | "submit" | "reset"
export type ButtonColor   = "white"   | "green"  | "red"
export type OnButtonClick = () => void | Promise<void>