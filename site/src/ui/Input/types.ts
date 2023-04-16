import { RefObject } from "react"

export interface Props {
    type?:         InputType
    invalid?:      boolean
    value?:        string
    onChange?:     OnInputChange
    disabled?:     boolean
    placeholder?:  string
    autoFocus?:    boolean
    onKeyDown?:    OnInputKeyEvent
    onKeyUp?:      OnInputKeyEvent
    autoComplete?: string
}

export type InputType       = "text" | "password"
export type OnInputChange   = (value: string) => void
export type OnInputKeyEvent = (event: InputKeyEvent) => void
export type InputElementRef = RefObject<HTMLInputElement>

export interface InputKeyEvent {
    altKey:   boolean
    ctrlKey:  boolean
    code:     string
    key:      string
    locale:   string
    location: number
    metaKey:  boolean
    repeat:   boolean
    shiftKey: boolean

    preventDefault(): void;
    isDefaultPrevented(): boolean;
}