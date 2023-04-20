import Button                                                 from "ui/Button/Component"
import Input                                                  from "ui/Input/Component"
import styles                                                 from "./styles.module.css"
import TerminalContext                                        from "./Context"

import { FormEvent, useState, useEffect, useRef, useContext } from "react"
import { InputKeyEvent                                      } from "ui/Input/types"
import { TerminalProps, TerminalRecord                      } from "./types"
import { makeTerminalRecord                                 } from "./util"

export default function Terminal(props: TerminalProps) {
    const { onEnter, disabled, htmlOutput } = props
    const [ input,   setInput             ] = useState("")
    const [ records,                      ] = useContext(TerminalContext)
    const historyIndex                      = useRef(null as number           | null)
    const end                               = useRef(null as HTMLDivElement   | null)
    const inputElement                      = useRef(null as HTMLInputElement | null)

    useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [records])

    return <div className={styles.terminal}>
        <ol className={styles.output}>
            {recordsToElementList(records)}
            <div ref={end} />
        </ol>
        <form onSubmit={onSubmit} onKeyDown={onKeyDown} className={styles.form}>
            <Input placeholder="Enter a command..." value={input} onChange={setInput} autoFocus={true} disabled={disabled} ref={inputElement} />
            <Button type="submit" disabled={disabled}>Send</Button>
        </form>
    </div>

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        clearHistoryIndex()
        onEnter?.(makeTerminalRecord("input", input))
        setInput("")
    }

    function onKeyDown(event: InputKeyEvent) {
        switch (event.code) {
            case "ArrowUp":
                event.preventDefault()
                stepHistoryBackward()
                break

            case "ArrowDown":
                event.preventDefault()
                stepHistoryForward()
                break
        }
    }

    function clearHistoryIndex() {
        historyIndex.current = null
    }

    function stepHistoryForward() {
        if (records.length === 0 || historyIndex.current == null)
            return

        for (let index = historyIndex.current + 1; index < records.length; ++index) {
            const { type, text } = records[index]

            if (type === "input") {
                historyIndex.current = index
                setInput(text)
                break
            }
        }
    }

    function stepHistoryBackward() {
        if (records.length === 0)
            return

        for (let index = (historyIndex.current ?? records.length) - 1; index > 0; --index) {
            const { type, text } = records[index]

            if (type === "input") {
                historyIndex.current = index
                setInput(text)
                break
            }
        }
    }

    function recordsToElementList(records: TerminalRecord[]): JSX.Element[] {
        const preparedRecords = prepareRecords()
        const elements        = [] as JSX.Element[]

        for (const [i, record] of preparedRecords.entries()) {
            const element = recordToElement(record, i)
            elements.push(element)
        }

        return elements

        function prepareRecords(): TerminalRecord[] {
            const prepared = []   as TerminalRecord[]
            let   prev     = null as TerminalRecord | null

            for (const cur of records) {
                const prevDate = prev?.time.getDate()
                const curDate  = cur.time.getDate()

                if (prevDate !== curDate) {
                    const info = makeTerminalRecord("info", cur.time.toLocaleDateString())
                    prepared.push(info)
                }

                prepared.push(cur)

                prev = cur
            }

            return prepared
        }

        function recordToElement(record: TerminalRecord, index: number = 0): JSX.Element {
            const { time, text, type } = record
            const className            = styles[type + "Record"]

            return <li className={className} key={recordToKey()}>
                <span className={styles.time}>{time.toLocaleTimeString()}</span>
                {makeText()}
            </li>

            function recordToKey(): string {
                return `${index}/${record.time.toISOString()}`
            }

            function makeText() {
                if (type === "output" && htmlOutput)
                    return <span className={styles.text} dangerouslySetInnerHTML={{ __html: text }} />

                return <span className={styles.text}>{text}</span>
            }
        }
    }
}