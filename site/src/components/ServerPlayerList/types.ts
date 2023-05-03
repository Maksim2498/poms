import Server                from "logic/Server"

import { OnPlayerCardClick } from "ui/PlayerCard"

export interface ServerPlayerListProps {
    onPlayerClick?: OnPlayerCardClick
    server:         Server
}