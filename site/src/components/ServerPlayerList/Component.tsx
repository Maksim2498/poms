import Server                    from "logic/Server"
import Player                    from "logic/Player"
import useAsync                  from "hooks/useAsync"
import Loading                   from "ui/Loading/Component"
import PlayerCard                from "ui/PlayerCard/Component"
import ErrorText                 from "ui/ErrorText/Component"

import { useContext, useEffect } from "react"
import { AuthControllerContext } from "pages/App/Component"
import { OnPlayerCardClick         } from "ui/PlayerCard/Component"

import "./style.css"

export interface Props {
    onPlayerClick?: OnPlayerCardClick
    server:         Server
}

export default function ServerPlayerList(props: Props) {
    const { server, onPlayerClick } = props
    const authController            = useContext(AuthControllerContext)
    const [players, loading, error] = useAsync(getPlayers)

    useEffect(() => {
        if (error != null)
            error != null && console.error(error)
    }, [error])

    if (loading)
        return <div className="loading ServerPlayerList">
            <Loading />
        </div>

    if (error != null)
        return <div className="error ServerPlayerList">
            <ErrorText>Loading failed</ErrorText>
        </div>

    return <ul className="loaded ServerPlayerList">
        {players.map(player => <li key={player.nickname}>
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