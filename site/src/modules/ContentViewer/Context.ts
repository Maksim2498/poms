import { createContext           } from "react"
import { ContentStackContextType } from "./types"

const ContentStackContext = createContext([[], defaultSetContentStack, { current: [] }] as ContentStackContextType)

function defaultSetContentStack() {
    throw new Error("Missing ContentStackContext.Provider")
}

export default ContentStackContext