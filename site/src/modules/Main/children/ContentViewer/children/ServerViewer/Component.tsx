import useAsync                  from "hooks/useAsync"
import Server                    from "logic/Server"
import Loading                   from "ui/Loading/Component"
import ServerIcon                from "ui/ServerIcon/Component"
import ServerMotd                from "ui/ServerMotd/Component"
import ErrorText                 from "ui/ErrorText/Component"
import ServerVersion             from "ui/ServerVersion/Component"
import ServerPlayerList          from "components/ServerPlayerList/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "pages/App/Component"
import { OnPlayerCardClick     } from "ui/PlayerCard/Component"

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
        return <div className={styles.loading}>
            <Loading />
        </div>

    if (error != null)
        return <div className={styles.error}>
            <ErrorText>Server is offline</ErrorText>
        </div>

    return <div className={styles.loaded}>
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