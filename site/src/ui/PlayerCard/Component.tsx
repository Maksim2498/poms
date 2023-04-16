import UserIcon       from "ui/UserIcon/Component"
import TaggedUserName from "ui/TaggedUserName/Component"
import styles         from "./styles.module.css"

import { Props      } from "./types"

export default function PlayerCard(props: Props) {
    const { player, onClick  } = props
    const { user,   nickname } = player

    if (user != null)
        return <div className={styles.authorized} onClick={rawOnClick}>
            {icon()}
            <div className={styles.user}>
                <TaggedUserName user={user} />
            </div>
            {playingAs()}
        </div>

    return <div className={styles.anonym} onClick={rawOnClick}>
        {icon()}
        <div className={styles.user}>
            Anonymous
        </div>
        {playingAs()}
    </div>

    function rawOnClick() {
        onClick?.(player)
    }

    function icon() {
        return <div className={styles.icon}>
            <UserIcon user={user} />
        </div>
    }

    function playingAs() {
        return <div className={styles.nickname}>
            playing as <span className={styles.value}>{nickname}</span>
        </div>
    }
}