import { createContext   } from "react"
import { UserContextType } from "./types"

export const UserContext = createContext([undefined, defaultSetNullableUser] as UserContextType)

function defaultSetNullableUser() {
    throw new Error("Missing UserContext.Provider")
}