import Button                                     from "ui/Button/Component"
import Input                                      from "ui/Input/Component"

import { FormEvent, useState, useEffect, useRef } from "react"

import "./style.css"

export interface Props {
    records?: Record[]
    onEnter?: OnEnter
}

export type OnEnter = (record: Record) => void

export interface Record {
    type: Type
    time: Date
    text: string
}

export type Type  = "input"
                  | "output"
                  | "info"
                  | "success"
                  | "error"

export default function Terminal(props: Props) {
    const { onEnter             } = props
    const [ records, setRecords ] = useState([] as Record[])
    const [ input,   setInput   ] = useState("")
    const endRef                  = useRef(null as HTMLDivElement | null)

    useEffect(() => {
        setRecords(props.records ?? [])
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [props.records])

    return <div className="Terminal">
        <ol className="output">
            {recordsToElementList(records)}
            <div className="end" ref={endRef} />
        </ol>
        <form onSubmit={onSubmit}>
            <Input placeholder="Enter a command..." value={input} onChange={setInput} autoFocus={true} />
            <Button type="submit">Send</Button>
        </form>
    </div>

    function onSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const record = makeRecord("input", input)

        onEnter?.(record)
        pushRecord(record)
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
                <span className="text">{text}</span>
            </li>

            function recordToKey(): string {
                return `${index}/${record.time.toISOString()}`
            }
        }
    }

    function pushRecord(newRecord: Record) {
        setRecords([...records, newRecord])
    }
}

export function makeRecord(type: Type, text: string): Record {
    return {
        type,
        text,
        time: new Date()
    }
}