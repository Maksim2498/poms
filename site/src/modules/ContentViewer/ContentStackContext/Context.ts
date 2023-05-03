import { createContext           } from "react"
import { ContentStackContextType } from "./types"

const ContentStackContext = createContext({ current: [] } as ContentStackContextType)

export default ContentStackContext