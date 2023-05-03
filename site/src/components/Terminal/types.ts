import { TerminalRecord } from "./TerminalContext"

export interface TerminalProps {
    htmlOutput?: boolean
    disabled?:   boolean
    onEnter?:    OnTerminalRecordEnter
}

export type OnTerminalRecordEnter = (record: TerminalRecord) => void