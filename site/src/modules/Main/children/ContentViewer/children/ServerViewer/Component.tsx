import useAsync                  from "hooks/useAsync"
import Server                    from "logic/Server"
import Loading                   from "ui/Loading/Component"
import ServerIcon                from "ui/ServerIcon/Component"
import ServerMotd                from "ui/ServerMotd/Component"
import ErrorText                 from "ui/ErrorText/Component"
import ServerVersion             from "ui/ServerVersion/Component"
import ServerPlayerList          from "components/ServerPlayerList/Component"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "pages/App/Component"
import { OnPlayerCardClick         } from "ui/PlayerCard/Component"

import "./style.css"

export interface Props {
    onPlayerClick?: OnPlayerCardClick
}

export default function ServerViewer(props: Props) {
    const { onPlayerClick        } = props
    const authController           = useContext(AuthControllerContext)
    const [server, loading, error] = useAsync(async () => await Server.fetch(authController))

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <div className="loading ServerViewer">
            <Loading />
        </div>

    if (error != null)
        return <div className="error ServerViewer">
            <ErrorText>Server is offline</ErrorText>
        </div>

    return <div className="loaded ServerViewer">
        <ServerIcon    server={server} />
        <ServerMotd    server={server} />
        <ServerVersion server={server} />
        {players()}
    </div>

    function players() {
        const { online, max } = server!.players

        return <div className="players section">
            <h3>Players ({online}/{max})</h3>
            <ServerPlayerList server={server!} onPlayerClick={onPlayerClick} />
        </div>
    }
}