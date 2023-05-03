import { TerminalRecord, TerminalRecordType, TerminalContextType } from "./types"

export function clearTerminalRecords(context: TerminalContextType) {
    context.current = []
}

export function pushNewTerminalRecord(context: TerminalContextType, type: TerminalRecordType, text: string) {
    pushTerminalRecord(context, makeTerminalRecord(type, text))
}

export function pushTerminalRecord(context: TerminalContextType, record: TerminalRecord) {
    context.current = [...context.current, record]
}

export function makeTerminalRecord(type: TerminalRecordType, text: string): TerminalRecord {
    return {
        type,
        text,
        time: new Date()
    }
}