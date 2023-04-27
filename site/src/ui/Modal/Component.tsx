import Dim                                                                                                   from "ui/Dim/Component"
import Button                                                                                                from "ui/Button/Component"
import Input                                                                                                 from "ui/Input/Component"
import FormErrorText                                                                                         from "ui/FormErrorText/Component"
import CheckBox                                                                                              from "ui/CheckBox/Component"
import FileInput                                                                                             from "ui/FileInput/Component"
import styles                                                                                                from "./styles.module.css"

import { useState, useEffect, MouseEvent                                                                   } from "react"
import { ModalProps, AnswerStates, TextAnswerState, CanvasAnswerState, AnswerState, BasicMouseEventHandler } from "./types"
import { makeState, updateState                                                                            } from "./util"

export default function Modal(props: ModalProps) {
    const {
        header,
        question,
        children: answers
    } = props

    const [states, setStates] = useState(makeStates())
    const [error,  setError ] = useState(undefined as string | undefined)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(updateStates, [answers])

    return <div className={styles.container}>
        <Dim />
        <div className={styles.modal}>
            {header   && <div className={styles.header  }>{header  }</div> }
            {question && <div className={styles.question}>{question}</div>}
            <div className={styles.answers}>
                {answers && Object.entries(answers).map(([key, answer]) => {
                    if (!answer || !(key in states))
                        return null

                    const { type, disable, autoFocus } = answer
                    const state                        = states[key]!
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

                            return <div key={key} className={styles.file}>
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
                            const {
                                onCanvasSet,
                                onMouseMove,
                                onMouseDown,
                                onMouseUp,
                                onMouseEnter,
                                onMouseLeave,
                            } = answer

                            const { canvas } = states[key] as CanvasAnswerState

                            return <div key          = {key}
                                        autoFocus    = {autoFocus}
                                        className    = {styles.canvasContainer}
                                        onMouseMove  = {rawOnMouseMove}
                                        onMouseDown  = {rawOnMouseDown}
                                        onMouseUp    = {rawOnMouseUp}
                                        onMouseEnter = {rawOnMouseEnter}
                                        onMouseLeave = {rawOnMouseLeave}
                                        ref          = {ref} />

                            function ref(ref: HTMLDivElement | null) {
                                if (ref == null)
                                    return

                                ref.innerHTML = ""
                                ref.appendChild(canvas)

                                onCanvasSet?.(canvas)
                            }

                            function rawOnMouseMove(event: MouseEvent<HTMLDivElement>) {
                                if (!onMouseMove)
                                    return

                                const [x, y] = mouseEventToPos(event)
                                const dx     = event.movementX
                                const dy     = event.movementY

                                onMouseMove(x, y, dx, dy)
                            }

                            function rawOnMouseDown(event: MouseEvent<HTMLDivElement>) {
                                passBasicMouseEvent(event, onMouseDown)
                            }

                            function rawOnMouseUp(event: MouseEvent<HTMLDivElement>) {
                                passBasicMouseEvent(event, onMouseUp)
                            }

                            function rawOnMouseEnter(event: MouseEvent<HTMLDivElement>) {
                                passBasicMouseEvent(event, onMouseEnter)
                            }

                            function rawOnMouseLeave(event: MouseEvent<HTMLDivElement>) {
                                passBasicMouseEvent(event, onMouseLeave)
                            }

                            function passBasicMouseEvent(event: MouseEvent<HTMLDivElement>, handler?: BasicMouseEventHandler) {
                                if (!handler)
                                    return

                                const [x, y] = mouseEventToPos(event)

                                handler(x, y)
                            }

                            function mouseEventToPos(event: MouseEvent<HTMLDivElement>): [number, number] {
                                const rect = event.currentTarget.getBoundingClientRect()
                                const x    = (event.clientX - rect.x) / rect.width  * canvas.width
                                const y    = (event.clientY - rect.y) / rect.height * canvas.height

                                return [x, y]
                            }
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

        const entries = [] as [string, AnswerState][]

        for (const [key, answer] of Object.entries(answers)) {
            if (!answer)
                continue

            entries.push([key, makeState(answer)])
        }

        return Object.fromEntries(entries)
    }

    function updateStates() {
        if (!answers)
            return

        const newStates = { ...states }

        for (const [key, answer] of Object.entries(answers)) {
            if (!answer)
                continue

            const state = states[key]

            newStates[key] = state != null ? updateState(state, answer)
                                           : makeState(answer)
        }

        setStates(newStates)
    }
}