import AppearingMessage from "./AppearingMessage"

import "styles/Greeting.css"

export default function Greeting() {
    return <div className="Greeting">
        <AppearingMessage text="Welcome to the POMS!" />
    </div>
}