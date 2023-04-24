import Dim                                                            from "ui/Dim/Component"
import Button                                                         from "ui/Button/Component"
import Input                                                          from "ui/Input/Component"
import FormErrorText                                                  from "ui/FormErrorText/Component"
import CheckBox                                                       from "ui/CheckBox/Component"
import styles                                                         from "./styles.module.css"

import { useState                                                   } from "react"
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH                } from "./constants"
import { ModalProps,        AnswerStates,        InputAnswerState,
         ButtonAnswerState, CheckBoxAnswerState, CanvasAnswerState  } from "./types"

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

                    switch (type) {
                        case "button": {
                            const { text, color, onClick } = answer

                            const {
                                loading,
                                disabled: oldDisabled
                            } = states[key] as ButtonAnswerState

                            const disabled = disable?.(states) ?? false

                            if (disabled !== oldDisabled)
                                setStates({
                                    ...states,
                                    [key]: {
                                        loading,
                                        disabled,
                                        type: "button"
                                    }
                                })

                            return <Button key       = {key}
                                           color     = {color}
                                           disabled  = {disabled}
                                           onClick   = {rawOnClick}
                                           autoFocus = {autoFocus}>
                                {text}
                            </Button>

                            async function rawOnClick() {
                                try {
                                    const result = onClick?.(states)

                                    if (result instanceof Promise) {
                                        setLoading(true)
                                        await result
                                    }
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

                        case "input": {
                            const {
                                placeholder,
                                autoComplete,
                                validate,
                                value,
                                inputType,
                                showErrorIfNotChanged,
                                format
                            } = answer

                            const {
                                changed,
                                invalid,
                                value:    oldValue,
                                disabled: oldDisabled
                            } = states[key] as InputAnswerState

                            const errorText = changed || showErrorIfNotChanged ? invalid : undefined
                            const disabled  = disable?.(states) ?? false

                            if (disabled !== oldDisabled)
                                setStates({
                                    ...states,
                                    [key]: {
                                        disabled,
                                        changed,
                                        invalid,
                                        type:  "input",
                                        value: oldValue
                                    }
                                })

                            return <div className={styles.input} key={key}>
                                <Input placeholder  = {placeholder}
                                       autoFocus    = {autoFocus}
                                       value        = {value}
                                       type         = {inputType}
                                       disabled     = {disabled}
                                       autoComplete = {autoComplete}
                                       onChange     = {onChange} />
                                
                                <FormErrorText>{errorText}</FormErrorText>
                            </div>

                            function onChange(value: string) {
                                if (format)
                                    value = format(value)

                                setStates({
                                    ...states,
                                    [key]: {
                                        value,
                                        disabled,
                                        type:    "input",
                                        changed: true,
                                        invalid: makeInvalid()
                                    }
                                })

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
                            const { checked, label } = answer

                            const {
                                changed,
                                checked:  oldChecked,
                                disabled: oldDisabled
                            } = states[key] as CheckBoxAnswerState

                            const disabled  = disable?.(states) ?? false

                            if (disabled !== oldDisabled)
                                setStates({
                                    ...states,
                                    [key]: {
                                        disabled,
                                        changed,
                                        type: "check-box",
                                        checked: oldChecked
                                    }
                                })

                            return <div key={key} className={styles.checkBox}>
                                <CheckBox checked={checked} onChange={onChange}>
                                    {label}
                                </CheckBox>
                            </div>

                            function onChange(checked: boolean) {
                                setStates({
                                    ...states,
                                    [key]: {
                                        checked,
                                        disabled,
                                        type:    "check-box",
                                        changed: true
                                    }
                                })
                            }
                        }

                        case "image": {
                            const {
                                canvas,
                                disabled: oldDisabled
                            } = states[key] as CanvasAnswerState

                            const disabled  = disable?.(states) ?? false

                            if (disabled !== oldDisabled)
                                setStates({
                                    ...states,
                                    [key]: {
                                        disabled,
                                        canvas,
                                        type: "image",
                                    }
                                })

                            return <div key       = {key}
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

                case "input": {
                    const value = answer.value ?? ""

                    states[key] = {
                        type:     "input",
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

                case "image": {
                    const { width, height, onCanvasCreated } = answer

                    const canvas = document.createElement("canvas")

                    canvas.width     = width  ?? DEFAULT_CANVAS_WIDTH
                    canvas.height    = height ?? DEFAULT_CANVAS_HEIGHT
                    canvas.className = styles.canvas
                    canvas.innerHTML = "Canvas isn't supported"

                    states[key] = {
                        canvas,
                        type:     "image",
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