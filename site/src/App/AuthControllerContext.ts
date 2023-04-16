import AuthInfo           from "logic/AuthInfo"

import { createContext  } from "react"
import { AuthController } from "logic/api"

export const AuthControllerContext = createContext([new AuthInfo(), defaultSetAuthInfo] as AuthController )

function defaultSetAuthInfo() {
    throw new Error("Missing AuthControllerContext.Provider")
}