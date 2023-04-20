import { createContext   } from "react"
import { UserContextType } from "./types"

const UserContext = createContext([undefined, defaultSetNullableUser] as UserContextType)

function defaultSetNullableUser() {
    throw new Error("Missing UserContext.Provider")
}

export default UserContext