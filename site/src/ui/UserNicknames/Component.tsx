import List       from "ui/List/Component"

import { Props } from "./types"

export default function UserNicknames(props: Props) {
    return <List header="Nicknames">
        {props.user.nicknames}
    </List>
}