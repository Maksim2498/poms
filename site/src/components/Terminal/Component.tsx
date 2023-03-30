import Button       from "ui/Button/Component"
import Input        from "ui/Input/Component"

import { FormEvent, useState } from "react"

import "./style.css"

export const DEFAULT_PREFIX = "⮁ "

export interface Props {
    prefix?:       string
    output?:       string[]
    input?:        string
    onEnter?:      OnEnter
    printEntered?: boolean
}

export type OnEnter = (value: string) => void

export default function Terminal(props: Props) {
    const prefix                    = props.prefix ?? DEFAULT_PREFIX
    const { onEnter, printEntered } = props
    const [ output,  setOutput    ] = useState(props.output ?? [])
    const [ input,   setInput     ] = useState(props.input  ?? "")

    return <div className="Terminal">
        <ul className="output">
            {output.map((line, index) => <li key={`${index}: ${line}`}>
                <span className="prefix">{prefix}</span>
                <span className="value">{line}</span>
            </li>)}
        </ul>
        <form onSubmit={onSubmit}>
            <Input placeholder="Enter a command..." value={input} onChange={setInput} autoFocus={true} />
            <Button type="submit">Send</Button>
        </form>
    </div>

    function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        onEnter?.(input)

        if (printEntered)
            setOutput([...output, input])

        setInput("")
    }
}