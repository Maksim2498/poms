import { createContext           } from "react"
import { MaxNicknamesContextType } from "./types"

const MaxNicknamesContext = createContext(5 as MaxNicknamesContextType)

export default MaxNicknamesContext