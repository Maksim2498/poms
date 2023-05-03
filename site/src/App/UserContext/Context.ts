import { createContext   } from "react"
import { UserContextType } from "./types"

const UserContext = createContext({ current: undefined } as UserContextType)

export default UserContext