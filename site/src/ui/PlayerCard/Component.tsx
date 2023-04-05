import Player         from "logic/Player"
import UserIcon       from "ui/UserIcon/Component"
import TaggedUserName from "ui/TaggedUserName/Component"

import "./style.css"

export interface Props {
    onClick?: OnPlayerCardClick
    player:   Player
}

export type OnPlayerCardClick = (player: Player) => void

export default function PlayerCard(props: Props) {
    const { player, onClick  } = props
    const { user,   nickname } = player
    const className            = (user == null ? "anonym" : "authorized") + " PlayerCard"

    if (user != null)
        return <div className="authorized PlayerCard" onClick={rawOnClick}>
            <UserIcon       user={user} />
            <TaggedUserName user={user} />
            <span className="nickname">plays as <span className="value">{nickname}</span></span>
        </div>

    return <div className={className} onClick={rawOnClick}>
        <UserIcon />
        <span className="anonym">Anonymous</span>
        <span className="nickname">plays as <span className="value">{nickname}</span></span>
    </div>

    function rawOnClick() {
        onClick?.(player)
    }
}