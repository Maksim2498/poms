import ReadonlyRefObject                                                     from "types/ReadonlyRefObject"
import Button                                                                from "ui/Button/Component"
import Input                                                                 from "ui/Input/Component"

import { FormEvent, useState, useEffect, useRef, useContext, createContext } from "react"

import "./style.css"

export const TerminalContext = createContext([[], defaultSetRecords, { current: []}] as TerminalContextType)

function defaultSetRecords() {
    throw new Error("Missing TerminalContext.Provider")
}

export type TerminalContextType = [Record[], SetRecords, RecordsRef]
export type SetRecords          = (newRecords: Record[]) => void
export type RecordsRef          = ReadonlyRefObject<Record[]>

export interface Props {
    htmlOutput?: boolean
    disabled?:   boolean
    onEnter?:    OnRecordEnter
}

export type OnRecordEnter = (record: Record) => void

export interface Record {
    type: RecordType
    time: Date
    text: string
}

export type RecordType  = "input"
                        | "output"
                        | "info"
                        | "success"
                        | "error"

export default function Terminal(props: Props) {
    const { onEnter, disabled, htmlOutput } = props
    const [ input,   setInput             ] = useState("")
    const [ records,                      ] = useContext(TerminalContext)
    const endRef                            = useRef(null as HTMLDivElement | null)

    useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [records])

    return <div className="Terminal">
        <ol className="output">
            {recordsToElementList(records)}
            <div className="end" ref={endRef} />
        </ol>
        <form onSubmit={onSubmit}>
            <Input placeholder="Enter a command..." value={input} onChange={setInput} autoFocus={true} disabled={disabled} />
            <Button type="submit" state={disabled ? "disabled" : "active"}>Send</Button>
        </form>
    </div>

    function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()
        onEnter?.(makeRecord("input", input))
        setInput("")
    }

    function recordsToElementList(records: Record[]): JSX.Element[] {
        const preparedRecords = prepareRecords()
        const elements        = [] as JSX.Element[]

        for (const [i, record] of preparedRecords.entries()) {
            const element = recordToElement(record, i)
            elements.push(element)
        }

        return elements

        function prepareRecords(): Record[] {
            const prepared = []   as Record[]
            let   prev     = null as Record | null

            for (const cur of records) {
                const prevDate = prev?.time.getDate()
                const curDate  = cur.time.getDate()

                if (prevDate !== curDate) {
                    const info = makeRecord("info", cur.time.toLocaleDateString())
                    prepared.push(info)
                }

                prepared.push(cur)

                prev = cur
            }

            return prepared
        }

        function recordToElement(record: Record, index: number = 0): JSX.Element {
            const { time, text, type } = record

            return <li className={`${type} record`} key={recordToKey()}>
                <span className="time">{time.toLocaleTimeString()}</span>
                {makeText()}
            </li>

            function recordToKey(): string {
                return `${index}/${record.time.toISOString()}`
            }

            function makeText() {
                if (type === "output" && htmlOutput)
                    return <span className="text" dangerouslySetInnerHTML={{ __html: text }} />

                return <span className="text">{text}</span>
            }
        }
    }
}

export function makeRecord(type: RecordType, text: string): Record {
    return {
        type,
        text,
        time: new Date()
    }
}