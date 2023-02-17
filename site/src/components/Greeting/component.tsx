import AppearingMessage from "components/AppearingMessage/component"

import "./style.css"

export interface Props {
    name?: string
}

export default function Greeting(props: Props) {
    const name = props.name
    const text = name != null ? `Welcome to the POMS, ${name}!`
                              : "Welcome to the POMS!"

    return <AppearingMessage text={text} />
}