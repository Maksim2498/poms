import App            from "pages/App/Component"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"

const root = createRoot(document.getElementById("root")!)

root.render(
    <StrictMode>
        <App />
    </StrictMode>
)