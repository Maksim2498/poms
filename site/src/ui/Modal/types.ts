import { ButtonColor, OnButtonClick } from "ui/Button/types"

export interface ModalProps {
    header?:  string
    question: string
    children: Answer[]
}

export interface Answer {
    text:       string
    color?:     ButtonColor
    onClick?:   OnButtonClick
    autoFocus?: boolean
}