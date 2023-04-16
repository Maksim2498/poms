import { createContext           } from "react"
import { ContentStackContextType } from "./types"

export const ContentStackContext = createContext([[], defaultSetContentStack, { current: [] }] as ContentStackContextType)

function defaultSetContentStack() {
    throw new Error("Missing ContentStackContext.Provider")
}