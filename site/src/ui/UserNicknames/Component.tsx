import User   from "logic/User"
import List from "ui/List/Component"

export interface Props {
    user: User
}

export default function UserNicknames(props: Props) {
    return <List header="Nicknames">
        {props.user.nicknames}
    </List>
}