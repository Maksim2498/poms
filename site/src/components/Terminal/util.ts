import { RecordType, Record } from "./types"

export function makeRecord(type: RecordType, text: string): Record {
    return {
        type,
        text,
        time: new Date()
    }
}