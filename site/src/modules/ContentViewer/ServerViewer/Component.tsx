import useAsync                  from "hooks/useAsync"
import Server                    from "logic/Server"
import AuthControllerContext     from "App/AuthControllerContext"
import LoadingContent            from "modules/ContentViewer/LoadingContent/Component"
import ErrorContent              from "modules/ContentViewer/ErrorContent/Component"
import ServerPlayerList          from "components/ServerPlayerList/Component"
import ServerIcon                from "ui/ServerIcon/Component"
import ServerMotd                from "ui/ServerMotd/Component"
import ServerVersion             from "ui/ServerVersion/Component"
import ServerAddress             from "ui/ServerAddress/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
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
        <div className={styles.general}>
            <div className={styles.icon}>
                <ServerIcon server={server} />
            </div>
            <div className={styles.motd}>
                <ServerMotd server={server} />
            </div>
            <div className={styles.version}>
                <ServerVersion server={server} />
            </div>
        </div>

        <ServerAddress server={server} />

        <ServerPlayerList server={server} onPlayerClick={onPlayerClick} />
    </div>
}