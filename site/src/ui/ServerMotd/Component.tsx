import { ServerMotdProps } from "./types"

export default function ServerMotd(props: ServerMotdProps) {
    return <pre dangerouslySetInnerHTML={{__html: props.server.motd.html }} />
}