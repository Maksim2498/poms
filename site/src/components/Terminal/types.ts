import ReadonlyRefObject from "types/ReadonlyRefObject"

export type TerminalContextType = [TerminalRecord[], SetRecords, RecordsRef]
export type SetRecords          = (newRecords: TerminalRecord[]) => void
export type RecordsRef          = ReadonlyRefObject<TerminalRecord[]>

export interface TerminalProps {
    htmlOutput?: boolean
    disabled?:   boolean
    onEnter?:    OnTerminalRecordEnter
}

export type OnTerminalRecordEnter = (record: TerminalRecord) => void

export interface TerminalRecord {
    type: TerminalRecordType
    time: Date
    text: string
}

export type TerminalRecordType  = "input"
                                | "output"
                                | "info"
                                | "success"
                                | "error"