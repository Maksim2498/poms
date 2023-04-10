import Server from "logic/Server";

export interface Props {
    server: Server
}

export default function ServerVersion(props: Props) {
    return <>{props.server.version.name}</>
}