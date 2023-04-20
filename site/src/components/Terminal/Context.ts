import { createContext       } from "react"
import { TerminalContextType } from "./types"

const TerminalContext = createContext([[], defaultSetRecords, { current: []}] as TerminalContextType)

function defaultSetRecords() {
    throw new Error("Missing TerminalContext.Provider")
}

export default TerminalContext