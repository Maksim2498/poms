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
    type:                   "input"
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

export type AnswerType = "button"
                       | "input"
                       | "check-box"

export type ValidateInput       = (input: string) => string | undefined
export type OnAnswerButtonClick = (states: AnswerStates) => void | Promise<void>
export type FormatInput         = (input: string) => string
export type DisableAnswer       = (values: AnswerStates) => boolean

export interface AnswerStates {
    [key: string]: AnswerState
}

export type AnswerState = ButtonAnswerState
                        | InputAnswerState
                        | CheckBoxAnswerState

export interface AnswerStateBase {
    type:     AnswerType
    disabled: boolean
}

export interface ButtonAnswerState extends AnswerStateBase {
    type:    "button"
    loading: boolean
}

export interface InputAnswerState extends AnswerStateBase {
    type:     "input"
    value:    string
    changed:  boolean
    invalid?: string | undefined
}

export interface CheckBoxAnswerState extends AnswerStateBase {
    type:    "check-box"
    checked: boolean
    changed: boolean
}