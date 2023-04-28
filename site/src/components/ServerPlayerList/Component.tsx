import Player                    from "logic/Player"
import useAsync                  from "hooks/useAsync"
import AuthControllerContext     from "App/AuthControllerContext"
import LoadingIndicator          from "ui/LoadingIndicator/Component"
import PlayerCard                from "ui/PlayerCard/Component"
import ErrorText                 from "ui/ErrorText/Component"
import List                      from "ui/List/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { ServerPlayerListProps } from "./types"

export default function ServerPlayerList(props: ServerPlayerListProps) {
    const { server, onPlayerClick } = props
    const authController            = useContext(AuthControllerContext)
    const [players, loading, error] = useAsync(getPlayers)

    useEffect(() => {
        if (error != null)
            console.error(error)
    }, [error])

    if (loading)
        return <div className={styles.loading}>
            <LoadingIndicator />
        </div>

    if (error != null)
        return <ErrorText>Loading failed</ErrorText>

    const { online, max } = server.players

    return <List header        = {`Players (${online}/${max})`}
                 itemClassName = {styles.item}
                 showIfEmpty   = {true}
                 evalKey       = {card => card.props.player.nickname}>
        {
            players.map(player => <PlayerCard player  = {player}
                                              onClick = {onPlayerClick}
                                              key     = {player.nickname} />)
        }
    </List>

    async function getPlayers(): Promise<Player[]> {
        const { sample } = server.players

        const playerPromises = sample.map(({login, nickname}) => login == null ? new Player({ nickname })
                                                                               : Player.get({ authController, login, nickname }))
                                     .filter(s => s != null) as Promise<Player>[]

        const players = await Promise.all(playerPromises)

        return Player.sort(players)
    }
}