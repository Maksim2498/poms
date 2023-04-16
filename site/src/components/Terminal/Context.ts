import { createContext       } from "react"
import { TerminalContextType } from "./types"

export const TerminalContext = createContext([[], defaultSetRecords, { current: []}] as TerminalContextType)

function defaultSetRecords() {
    throw new Error("Missing TerminalContext.Provider")
}