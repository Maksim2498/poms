import Server from "logic/Server";

export interface Props {
    server: Server
}

export default function ServerVersion(props: Props) {
    const { name } = props.server.version

    return <div className="ServerVersion">
        {name}
    </div>
}