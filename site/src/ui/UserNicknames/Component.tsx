import List                   from "ui/List/Component"

import { UserNicknamesProps } from "./types"

export default function UserNicknames(props: UserNicknamesProps) {
    return <List header="Nicknames" evalKey={value => value}>
        {props.user.nicknames ?? []}
    </List>
}