import { Props } from "./types"

export default function ServerVersion(props: Props) {
    return <>{props.server.version.name}</>
}