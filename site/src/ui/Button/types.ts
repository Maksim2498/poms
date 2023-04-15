export interface Props {
    type?:     ButtonType
    state?:    ButtonState
    onClick?:  OnButtonClick
    children?: any
}

export type ButtonType    = "regular" | "submit"   | "cancel"
export type ButtonState   = "active"  | "disabled" | "loading"
export type OnButtonClick = () => void | Promise<any>