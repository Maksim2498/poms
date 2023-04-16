import Server                from "logic/Server"

import { OnPlayerCardClick } from "ui/PlayerCard/types"

export interface Props {
    onPlayerClick?: OnPlayerCardClick
    server:         Server
}