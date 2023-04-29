import User                      from "logic/User"
import Player                    from "logic/Player"
import useAsync                  from "hooks/useAsync"
import useForceRerender          from "hooks/useForceRerender"
import AuthControllerContext     from "App/AuthControllerContext"
import UserContext               from "App/UserContext"
import LoadingIndicator          from "ui/LoadingIndicator/Component"
import PlayerCard                from "ui/PlayerCard/Component"
import ErrorText                 from "ui/ErrorText/Component"
import List                      from "ui/List/Component"
import styles                    from "./styles.module.css"

import { useContext, useEffect } from "react"
import { ServerPlayerListProps } from "./types"

export default function ServerPlayerList(props: ServerPlayerListProps) {
    const { server, onPlayerClick     } = props
    const forceRerender                 = useForceRerender()
    const authController                = useContext(AuthControllerContext)
    const [contextUser, setContextUser] = useContext(UserContext)
    const [players, loading, error    ] = useAsync(getPlayers)

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
                                                                               : Player.fetch({
                                                                                                  authController,
                                                                                                  login,
                                                                                                  nickname,
                                                                                                  deferIconLoading: true
                                                                                              }))
                                     .filter(s => s != null) as Promise<Player>[]

        const players       = await Promise.all(playerPromises)
        const sortedPlayers = Player.sort(players)

        for (const [i, player] of sortedPlayers.entries()) {
            const icon = player.user?.icon

            if (icon instanceof Promise) {
                const updatePlayerIcon = (icon: string | undefined) =>  {
                    const newUser   = player.user?.withIcon(icon)
                    const newPlayer = player.withUser(newUser)

                    sortedPlayers[i] = newPlayer

                    if (newUser != null) {
                        const updateContextUser =  contextUser
                                                && User.areLoginsEqual(newUser?.login, contextUser.login)
                                                && !contextUser.equalTo(newUser)

                        if (updateContextUser)
                            setContextUser(newUser)
                    }

                    forceRerender()
                }

                icon.then(updatePlayerIcon)
                    .catch(error => {
                        console.error(error)
                        updatePlayerIcon(undefined)
                    })
            }
        }

        return sortedPlayers
    }
}