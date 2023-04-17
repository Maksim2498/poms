import { TerminalRecordType, TerminalRecord } from "./types"

export function makeTerminalRecord(type: TerminalRecordType, text: string): TerminalRecord {
    return {
        type,
        text,
        time: new Date()
    }
}