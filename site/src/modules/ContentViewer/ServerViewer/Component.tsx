import useAsync                          from "hooks/useAsync"
import Server                            from "logic/Server"
import styles                            from "./styles.module.css"

import { useContext, useEffect, useRef } from "react"
import { AuthInfoContext               } from "App"
import { ServerPlayerList              } from "components/ServerPlayerList"
import { ServerIcon                    } from "ui/ServerIcon"
import { ServerMotd                    } from "ui/ServerMotd"
import { ServerVersion                 } from "ui/ServerVersion"
import { ServerAddress                 } from "ui/ServerAddress"
import { LoadingContent                } from "../LoadingContent"
import { ErrorContent                  } from "../ErrorContent"
import { ServerViewerProps             } from "./types"

export default function ServerViewer(props: ServerViewerProps) {
    const { onPlayerClick        } = props
    const authInfoRef              = useContext(AuthInfoContext)
    const [server, loading, error] = useAsync(fetchServer, [], () => abortControllerRef.current?.abort())
    const abortControllerRef       = useRef(undefined as AbortController | undefined)

    useEffect(() => {
        if (error != null && !abortControllerRef.current?.signal.aborted)
            console.error(error)
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

    async function fetchServer(): Promise<Server> {
        abortControllerRef.current = new AbortController()

        const { signal } = abortControllerRef.current

        return await Server.fetch(authInfoRef, signal)
    }
}