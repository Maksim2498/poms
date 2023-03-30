import Button       from "ui/Button/Component"
import Input        from "ui/Input/Component"

import { FormEvent, useState } from "react"

import "./style.css"

export interface Props {
    records?:      Record[]
    input?:        string
    onEnter?:      OnEnter
    printEntered?: boolean
}

export type OnEnter = (record: Record) => void

export interface Record {
    level: Level
    time:  Date
    text:  string
}

export type Level = "info" | "error"

export default function Terminal(props: Props) {
    const { onEnter, printEntered } = props
    const [ records, setRecords   ] = useState(props.records ?? [])
    const [ input,   setInput     ] = useState(props.input  ?? "")

    return <div className="Terminal">
        <ul className="output">
            {records.map((record, index) => <li key={recordToKey(record, index)}>
                {fmtRecord(record)}
            </li>)}
        </ul>
        <form onSubmit={onSubmit}>
            <Input placeholder="Enter a command..." value={input} onChange={setInput} autoFocus={true} />
            <Button type="submit">Send</Button>
        </form>
    </div>

    function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const record = inputToRecrod()

        onEnter?.(record)

        if (printEntered)
            setRecords([...records, record])

        setInput("")
    }

    function recordToKey(record: Record, index: number = 0): string {
        return `${index}/${record.time.toISOString()}`
    }

    function fmtRecord(record: Record): JSX.Element {
        const { time, level, text } = record

        return <span className={`${level} record`}>
            [<span className="time">{time.toLocaleString()}</span>] <span className={`${level} level`}>{level}</span>: <span className="text">{text}</span>
        </span>
    }

    function inputToRecrod(): Record {
        return {
            level: "info",
            time:  new Date(),
            text:  input
        }
    }
}