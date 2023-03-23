import LoadingIndicator from "ui/LoadingIndicator/component"
import Dim              from "ui/Dim/component"

import "./style.css"

export default function Loading() {
    return <div className="Loading">
        <Dim />
        <LoadingIndicator />
    </div>
}