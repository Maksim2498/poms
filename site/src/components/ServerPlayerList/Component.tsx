import Player                    from "logic/Player"
import useAsync                  from "hooks/useAsync"
import LoadingIndicator          from "ui/LoadingIndicator/Component"
import PlayerCard                from "ui/PlayerCard/Component"
import ErrorText                 from "ui/ErrorText/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "App/AuthControllerContext"
import { Props                 } from "./types"

export default function ServerPlayerList(props: Props) {
    const { server, onPlayerClick } = props
    const authController            = useContext(AuthControllerContext)
    const [players, loading, error] = useAsync(getPlayers)

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <div className={styles.loading}>
            <LoadingIndicator />
        </div>

    if (error != null)
        return <div className={styles.error}>
            <ErrorText>Loading failed</ErrorText>
        </div>

    return <ul className={styles.loaded}>
        {players.map(player => <li key={player.nickname} className={styles.item}>
            <PlayerCard player={player} onClick={onPlayerClick} />
        </li>)}
    </ul>

    async function getPlayers(): Promise<Player[]> {
        const { sample } = server.players
        const players    = sample.map(({login, nickname}) => login == null ? new Player({ nickname })
                                                                           : Player.fetch({ authController, login, nickname }))
                                 .filter(s => s != null) as Promise<Player>[]

        return Promise.all(players)
    }
}