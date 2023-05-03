import { createContext       } from "react"
import { TerminalContextType } from "./types"

const TerminalContext = createContext({ current: [] } as TerminalContextType)

export default TerminalContext