import { ButtonColor } from "ui/Button/types"
import { InputType   } from "ui/Input/types"

export interface ModalProps {
    header?:    string
    question?:  string
    children?:  Answers
}

export interface Answers {
    [key: string]: Answer | undefined
}

export type Answer = ButtonAnswer
                   | InputAnswer
                   | CheckBoxAnswer
                   | CanvasAnswer

export interface AnswerBase {
    type:       AnswerType
    disable?:   DisableAnswer
    autoFocus?: boolean
}

export interface ButtonAnswer extends AnswerBase {
    type:     "button"
    text:     string
    color?:   ButtonColor
    onClick?: OnAnswerButtonClick
}

export interface InputAnswer extends AnswerBase {
    type:                   "text"
    placeholder?:           string
    autoComplete?:          string
    inputType?:             InputType
    validate?:              ValidateInput
    value?:                 string
    format?:                FormatInput
    showErrorIfNotChanged?: boolean
}

export interface CheckBoxAnswer extends AnswerBase {
    type:     "check-box"
    checked?: boolean
    label?:   string
}

export interface CanvasAnswer extends AnswerBase {
    type:             "canvas"
    width?:           number
    height?:          number
    onCanvasCreated?: OnCanvasCreated
}

export type ValidateInput       = (input: string) => string | undefined
export type OnAnswerButtonClick = (states: AnswerStates) => void | Promise<void>
export type FormatInput         = (input: string) => string
export type DisableAnswer       = (values: AnswerStates) => boolean
export type OnCanvasCreated     = (canvas: HTMLCanvasElement) => void

export interface AnswerStates {
    [key: string]: AnswerState
}

export type AnswerState = ButtonAnswerState
                        | InputAnswerState
                        | CheckBoxAnswerState
                        | CanvasAnswerState

export interface AnswerStateBase {
    type:     AnswerType
    disabled: boolean
}

export interface ButtonAnswerState extends AnswerStateBase {
    type:    "button"
    loading: boolean
}

export interface InputAnswerState extends AnswerStateBase {
    type:     "text"
    value:    string
    changed:  boolean
    invalid?: string | undefined
}

export interface CheckBoxAnswerState extends AnswerStateBase {
    type:    "check-box"
    checked: boolean
    changed: boolean
}

export interface CanvasAnswerState extends AnswerStateBase {
    type:   "canvas"
    canvas: HTMLCanvasElement
}


export type AnswerType = "button"
                       | "text"
                       | "check-box"
                       | "canvas"