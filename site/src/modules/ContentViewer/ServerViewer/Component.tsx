import useAsync                  from "hooks/useAsync"
import Server                    from "logic/Server"
import LoadingContent            from "modules/ContentViewer/LoadingContent/Component"
import ErrorContent              from "modules/ContentViewer/ErrorContent/Component"
import ServerIcon                from "ui/ServerIcon/Component"
import ServerMotd                from "ui/ServerMotd/Component"
import ServerVersion             from "ui/ServerVersion/Component"
import ServerPlayerList          from "components/ServerPlayerList/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "App/AuthControllerContext"
import { ServerViewerProps     } from "./types"

export default function ServerViewer(props: ServerViewerProps) {
    const { onPlayerClick        } = props
    const authController           = useContext(AuthControllerContext)
    const [server, loading, error] = useAsync(async () => await Server.fetch(authController))

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <LoadingContent />

    if (error != null)
        return <ErrorContent>Server is offline</ErrorContent>

    return <div className={styles.server}>
        <div className={styles.icon}>
            <ServerIcon server={server} />
        </div>
        <div className={styles.motd}>
            <ServerMotd server={server} />
        </div>
        <div className={styles.version}>
            <ServerVersion server={server} />
        </div>
        {players()}
    </div>

    function players() {
        const { online, max } = server!.players

        return <div className={styles.players}>
            <h3 className={styles.header}>Players ({online}/{max})</h3>
            <ServerPlayerList server={server!} onPlayerClick={onPlayerClick} />
        </div>
    }
}