import ReadonlyRefObject from "types/ReadonlyRefObject"

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