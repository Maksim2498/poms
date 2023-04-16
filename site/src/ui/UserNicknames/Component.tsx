import List       from "ui/List/Component"

import { Props } from "./types"

export default function UserNicknames(props: Props) {
    return <List header="Nicknames" evalKey={value => value}>
        {props.user.nicknames}
    </List>
}