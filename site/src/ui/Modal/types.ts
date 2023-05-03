import { ButtonColor } from "ui/Button"
import { InputType   } from "ui/Input"

export interface ModalProps {
    header?:    string
    question?:  string
    children?:  Answers
}

export interface Answers {
    [key: string]: Answer | undefined | null | false
}

export type Answer = ButtonAnswer
                   | TextAnswer
                   | CheckBoxAnswer
                   | FileAnswer
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
    onClick?: OnButtonAnswerClick
}

export interface TextAnswer extends AnswerBase {
    type:                   "text"
    placeholder?:           string
    autoComplete?:          string
    inputType?:             InputType
    validate?:              ValidateInput
    value?:                 string
    format?:                FormatInput
    showErrorIfNotChanged?: boolean
    onChange?:              OnTextAnswerChange
}

export interface CheckBoxAnswer extends AnswerBase {
    type:      "check-box"
    checked?:  boolean
    label?:    string
    onChange?: OnCheckBoxAnswerChange
}

export interface FileAnswer extends AnswerBase {
    type:      "file"
    label?:    string
    accept?:   string
    onChange?: OnFileAnswerChange
}

export interface CanvasAnswer extends AnswerBase {
    type:          "canvas"
    width?:        number
    height?:       number
    onCanvasSet?:  OnCanvasSet
    onMouseMove?:  OnMouseMove
    onMouseDown?:  OnMouseDown
    onMouseUp?:    OnMouseUp
    onMouseEnter?: OnMouseEnter
    onMouseLeave?: OnMouseLeave
}

export type ValidateInput          = (input: string) => string | undefined
export type OnButtonAnswerClick    = (states: AnswerStates) => AnswerStates | void | Promise<AnswerStates | void>
export type OnTextAnswerChange     = (input: string, states: AnswerStates) => AnswerStates | void
export type OnCheckBoxAnswerChange = (checked: boolean, states: AnswerStates) => AnswerStates | void
export type OnFileAnswerChange     = (files: FileList | null, states: AnswerStates) => AnswerStates | void
export type FormatInput            = (input: string) => string
export type DisableAnswer          = (values: AnswerStates) => boolean
export type OnCanvasSet            = (canvas: HTMLCanvasElement) => void
export type OnMouseMove            = (x: number, y: number, dx: number, dy: number) => void
export type OnMouseDown            = BasicMouseEventHandler
export type OnMouseUp              = BasicMouseEventHandler
export type OnMouseEnter           = BasicMouseEventHandler
export type OnMouseLeave           = BasicMouseEventHandler
export type BasicMouseEventHandler = (x: number, y: number) => void

export interface AnswerStates {
    [key: string]: AnswerState | undefined
}

export type AnswerState = ButtonAnswerState
                        | TextAnswerState
                        | CheckBoxAnswerState
                        | FileAnswerState
                        | CanvasAnswerState

export interface AnswerStateBase {
    type:     AnswerType
    disabled: boolean
}

export interface ButtonAnswerState extends AnswerStateBase {
    type:    "button"
    loading: boolean
}

export interface TextAnswerState extends AnswerStateBase {
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

export interface FileAnswerState extends AnswerStateBase {
    type:    "file"
    changed: boolean
    files:   FileList | null
}

export interface CanvasAnswerState extends AnswerStateBase {
    type:   "canvas"
    canvas: HTMLCanvasElement
}

export type AnswerType = "button"
                       | "text"
                       | "check-box"
                       | "file"
                       | "canvas"