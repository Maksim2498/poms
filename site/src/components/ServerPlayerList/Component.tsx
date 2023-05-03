import User                              from "logic/User"
import Player                            from "logic/Player"
import useAsync                          from "hooks/useAsync"
import useForceRerender                  from "hooks/useForceRerender"
import styles                            from "./styles.module.css"

import { useContext, useEffect, useRef } from "react"
import { AuthInfoContext, UserContext  } from "App"
import { LoadingIndicator              } from "ui/LoadingIndicator"
import { PlayerCard                    } from "ui/PlayerCard"
import { ErrorText                     } from "ui/ErrorText"
import { List                          } from "ui/List"
import { ServerPlayerListProps         } from "./types"

export default function ServerPlayerList(props: ServerPlayerListProps) {
    const { server, onPlayerClick } = props

    const forceRerender             = useForceRerender()

    const authInfoRef               = useContext(AuthInfoContext)
    const contextUserRef            = useContext(UserContext)

    const [players, loading, error] = useAsync(fetchPlayers, [], () => abortControllerRef.current?.abort())

    const abortControllerRef        = useRef(undefined as AbortController | undefined)

    useEffect(() => {
        if (error != null && !abortControllerRef.current?.signal.aborted)
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

    async function fetchPlayers(): Promise<Player[]> {
        abortControllerRef.current = new AbortController()

        const { signal } = abortControllerRef.current
        const { sample } = server.players

        const playerPromises = sample.map(({login, nickname}) => {
            if (login == null)
                return new Player({ nickname})

            return Player.fetch({
                deferIconLoading: true,
                authInfoRef,
                nickname,
                signal,
                login,
            })
        }) as Promise<Player>[]

        const players       = await Promise.all(playerPromises)
        const sortedPlayers = Player.sort(players)
        const contextUser   = contextUserRef.current

        for (const [i, player] of sortedPlayers.entries()) {
            const icon = player.user?.icon

            if (icon instanceof Promise) {
                const updatePlayerIcon = (icon: string | undefined) =>  {
                    const newUser   = player.user?.withIcon(icon)
                    const newPlayer = player.withUser(newUser)

                    sortedPlayers[i] = newPlayer

                    const updateContextUser =  newUser != null
                                            && contextUser
                                            && User.areLoginsEqual(newUser?.login, contextUser.login)
                                            && !contextUser.equalTo(newUser)

                    if (updateContextUser)
                        contextUserRef.current = newUser

                    forceRerender()
                }

                icon.then(updatePlayerIcon)
                    .catch(error => {
                        if (signal.aborted)
                            return

                        console.error(error)

                        updatePlayerIcon(undefined)
                    })
            }
        }

        return sortedPlayers
    }
}