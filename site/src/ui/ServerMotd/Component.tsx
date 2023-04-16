import { Props } from "./types"

export default function ServerMotd(props: Props) {
    return <pre dangerouslySetInnerHTML={{__html: props.server.motd.html }} />
}