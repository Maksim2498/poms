import Server from "logic/Server"

export interface Props {
    server: Server
}

export default function ServerMotd(props: Props) {
    return <pre className="ServerMotd" dangerouslySetInnerHTML={{__html: props.server.motd.html }} />
}