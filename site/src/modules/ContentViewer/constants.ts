import Console     from "./Console/Component"
import Home        from "./Home/Component"

import { Content } from "./types"

export const HOME_CONTENT = {
    name:      "Home",
    component: Home
} as Content

export const CONSOLE_CONTENT = {
    name:       "Server Console",
    selectName: "Console",
    component:  Console
}