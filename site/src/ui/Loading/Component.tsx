import LoadingIndicator from "ui/LoadingIndicator/Component"
import Dim              from "ui/Dim/Component"

import "./style.css"

export default function Loading() {
    return <div className="Loading">
        <Dim />
        <LoadingIndicator />
    </div>
}