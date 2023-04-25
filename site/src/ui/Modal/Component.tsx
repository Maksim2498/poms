import Dim                                                              from "ui/Dim/Component"
import Button                                                           from "ui/Button/Component"
import Input                                                            from "ui/Input/Component"
import FormErrorText                                                    from "ui/FormErrorText/Component"
import CheckBox                                                         from "ui/CheckBox/Component"
import FileInput                                                        from "ui/FileInput/Component"
import styles                                                           from "./styles.module.css"

import { useState                                                     } from "react"
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH                  } from "./constants"
import { ModalProps, AnswerStates, TextAnswerState, CanvasAnswerState } from "./types"

export default function Modal(props: ModalProps) {
    const {
        header,
        question,
        children: answers
    } = props

    const [states, setStates ] = useState(makeStates())
    const [error,  setError  ] = useState(undefined as string | undefined)

    return <div className={styles.container}>
        <Dim />
        <div className={styles.modal}>
            {header   && <div className={styles.header  }>{header  }</div> }
            {question && <div className={styles.question}>{question}</div>}
            <div className={styles.answers}>
                {answers && Object.entries(answers).map(([key, answer]) => {
                    if (!answer)
                        return null

                    const { type, disable, autoFocus } = answer
                    const state                        = states[key]
                    const { disabled: oldDisabled    } = state
                    const disabled                     = disable?.(states) ?? false

                    if (disabled !== oldDisabled)
                        setStates({
                            ...states,
                            [key]: { ...state, disabled }
                        })

                    switch (type) {
                        case "button": {
                            const { text, color, onClick } = answer

                            return <Button key       = {key}
                                           color     = {color}
                                           disabled  = {disabled}
                                           onClick   = {rawOnClick}
                                           autoFocus = {autoFocus}>
                                {text}
                            </Button>

                            async function rawOnClick() {
                                try {
                                    let result = onClick?.(states)

                                    if (result instanceof Promise) {
                                        setLoading(true)
                                        result = await result
                                    }

                                    if (result != null)
                                        setStates(result)
                                } catch (error) {
                                    setError(error instanceof Error ? error.message : String(error))
                                } finally {
                                    setLoading(false)
                                }

                                function setLoading(loading: boolean) {
                                    setStates({
                                        ...states,
                                        [key]: {
                                            disabled,
                                            loading,
                                            type: "button",
                                        }
                                    })
                                }
                            }
                        }

                        case "text": {
                            const {
                                placeholder,
                                autoComplete,
                                validate,
                                value,
                                inputType,
                                showErrorIfNotChanged,
                                format,
                                onChange
                            } = answer

                            const {
                                changed,
                                invalid,
                            } = state as TextAnswerState

                            const errorText = changed || showErrorIfNotChanged ? invalid : undefined
                            const disabled  = disable?.(states) ?? false

                            return <div className={styles.input} key={key}>
                                <Input placeholder  = {placeholder}
                                       autoFocus    = {autoFocus}
                                       value        = {value}
                                       type         = {inputType}
                                       disabled     = {disabled}
                                       autoComplete = {autoComplete}
                                       onChange     = {rawOnChange} />
                                
                                <FormErrorText>{errorText}</FormErrorText>
                            </div>

                            function rawOnChange(value: string) {
                                if (format)
                                    value = format(value)

                                let newStates = {
                                    ...states,
                                    [key]: {
                                        value,
                                        disabled,
                                        type:    "text",
                                        changed: true,
                                        invalid: makeInvalid()
                                    }
                                } as const

                                newStates = onChange?.(value, newStates) ?? newStates
                                setStates(newStates)

                                function makeInvalid() {
                                    try {
                                        return validate?.(value)
                                    } catch (error) {
                                        return error instanceof Error ? error.message
                                                                      : String(error)
                                    }
                                }
                            }
                        }

                        case "check-box": {
                            const { checked, label, onChange } = answer

                            return <div key={key} className={styles.checkBox}>
                                <CheckBox checked   = {checked}
                                          onChange  = {rawOnChange}
                                          disabled  = {disabled}
                                          autoFocus = {autoFocus}>
                                    {label}
                                </CheckBox>
                            </div>

                            function rawOnChange(checked: boolean) {
                                let newStates = {
                                    ...states,
                                    [key]: {
                                        checked,
                                        disabled,
                                        type:    "check-box",
                                        changed: true
                                    }
                                } as const

                                newStates = onChange?.(checked, newStates) ?? newStates
                                setStates(newStates)
                            }
                        }

                        case "file": {
                            const { label, accept, onChange } = answer

                            return <div className    = {styles.file}>
                                <FileInput accept    = {accept}
                                           disabled  = {disabled}
                                           autoFocus = {autoFocus}
                                           onChange  = {rawOnChange}>
                                    {label}
                                </FileInput>
                            </div>

                            function rawOnChange(files: FileList | null) {
                                let newStates = {
                                    ...states,
                                    [key]: {
                                        files,
                                        disabled,
                                        type:    "file",
                                        changed: true
                                    }
                                } as const

                                newStates = onChange?.(files, newStates) ?? newStates
                                setStates(newStates)
                            }
                        }

                        case "canvas": {
                            const { canvas } = states[key] as CanvasAnswerState

                            return <div key       = {key}
                                        autoFocus = {autoFocus}
                                        className = {styles.canvasContainer}
                                        ref       = {ref => ref?.appendChild(canvas)} />
                        }

                        default:
                            return null
                    }
                })}
                <FormErrorText>{error}</FormErrorText>
            </div>
        </div>
    </div>

    function makeStates(): AnswerStates {
        if (!answers)
            return {}

        const states = {} as AnswerStates

        for (const [key, answer] of Object.entries(answers)) {
            if (!answer)
                continue

            switch (answer.type) {
                case "button": {
                    states[key] = {
                        type:     "button",
                        disabled: false,
                        loading:  false
                    }

                    break
                }

                case "text": {
                    const value = answer.value ?? ""

                    states[key] = {
                        type:     "text",
                        disabled: false,
                        value:    value,
                        changed:  false,
                        invalid:  answer.validate?.(value)
                    }

                    break
                }

                case "check-box": {
                    const checked = answer.checked ?? false

                    states[key] = {
                        checked,
                        type:     "check-box",
                        disabled: false,
                        changed:  false
                    }

                    break
                }

                case "file": {
                    states[key] = {
                        type:     "file",
                        files:    null,
                        disabled: false,
                        changed:  false
                    }

                    break
                }

                case "canvas": {
                    const { width, height, onCanvasCreated } = answer

                    const canvas = document.createElement("canvas")

                    canvas.width     = width  ?? DEFAULT_CANVAS_WIDTH
                    canvas.height    = height ?? DEFAULT_CANVAS_HEIGHT
                    canvas.className = styles.canvas
                    canvas.innerHTML = "Canvas isn't supported"

                    states[key] = {
                        canvas,
                        type:     "canvas",
                        disabled: false
                    }

                    onCanvasCreated?.(canvas)

                    break
                }
            }
        }

        return states
    }
}