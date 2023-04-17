import Player from "logic/Player"

export interface PlayerCardProps {
    onClick?: OnPlayerCardClick
    player:   Player
}

export type OnPlayerCardClick = (player: Player) => void