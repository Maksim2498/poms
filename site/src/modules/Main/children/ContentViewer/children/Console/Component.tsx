import Terminal from "components/Terminal/Component";

import "./style.css"

export default function Console() {
    return <div className="Console">
        <Terminal printEntered={true} />
    </div>
}