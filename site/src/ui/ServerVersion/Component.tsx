import { ServerVersionProps } from "./types"

export default function ServerVersion(props: ServerVersionProps) {
    return <>{props.server.version.name}</>
}