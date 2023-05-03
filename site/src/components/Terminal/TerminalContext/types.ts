import { MutableRefObject } from "react"

export type TerminalContextType = MutableRefObject<TerminalRecord[]>

export interface TerminalRecord {
    type: TerminalRecordType
    time: Date
    text: string
}

export type TerminalRecordType = "input"
                               | "output"
                               | "info"
                               | "success"
                               | "error"