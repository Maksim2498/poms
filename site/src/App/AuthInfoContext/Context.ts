import AuthInfo                from "logic/AuthInfo"

import { createContext       } from "react"
import { AuthInfoContextType } from "./types"

const AuthInfoContext = createContext({ current: new AuthInfo() } as AuthInfoContextType)

export default AuthInfoContext