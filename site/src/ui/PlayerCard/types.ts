import Player from "logic/Player"

export interface Props {
    onClick?: OnPlayerCardClick
    player:   Player
}

export type OnPlayerCardClick = (player: Player) => void