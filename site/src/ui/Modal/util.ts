import styles                                                                                                       from "./styles.module.css"

import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH                                                              } from "./constants"
import { ButtonAnswer,      CanvasAnswer,      CheckBoxAnswer,      FileAnswer,      TextAnswer,      Answer, 
         ButtonAnswerState, CanvasAnswerState, CheckBoxAnswerState, FileAnswerState, TextAnswerState, AnswerState } from "./types"

export function makeState(answer: Answer): AnswerState {
    switch (answer.type) {
        case "button":
            return makeButtonState(answer)

        case "text":
            return makeTextState(answer)

        case "check-box":
            return makeCheckBoxState(answer)

        case "file":
            return makeFileState(answer)

        case "canvas":
            return makeCanvasState(answer)
    }
}

export function makeButtonState(answer: ButtonAnswer): ButtonAnswerState {
    return {
        type:     "button",
        disabled: false,
        loading:  false
    }
}

export function makeTextState(answer: TextAnswer): TextAnswerState {
    const value = answer.value ?? ""

    return {
        type:     "text",
        disabled: false,
        value:    value,
        changed:  false,
        invalid:  answer.validate?.(value)
    }
}

export function makeCheckBoxState(answer: CheckBoxAnswer): CheckBoxAnswerState {
    return {
        type:     "check-box",
        checked:  answer.checked ?? false,
        disabled: false,
        changed:  false
    }
}

export function makeFileState(answer: FileAnswer): FileAnswerState {
    return {
        type:     "file",
        files:    null,
        disabled: false,
        changed:  false
    }
}

export function makeCanvasState(answer: CanvasAnswer): CanvasAnswerState {
    const { width, height, onCanvasCreated } = answer

    const canvas = document.createElement("canvas")

    canvas.width     = width  ?? DEFAULT_CANVAS_WIDTH
    canvas.height    = height ?? DEFAULT_CANVAS_HEIGHT
    canvas.className = styles.canvas
    canvas.innerHTML = "Canvas isn't supported"

    onCanvasCreated?.(canvas)

    return {
        canvas,
        type:     "canvas",
        disabled: false
    }
}