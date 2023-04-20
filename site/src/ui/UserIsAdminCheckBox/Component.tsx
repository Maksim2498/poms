import CheckBox                     from "ui/CheckBox/Component"

import { useState                 } from "react"
import { UserIsAdminCheckBoxProps } from "./types"

export default function UserIsAdminCheckBox(props: UserIsAdminCheckBoxProps) {
    const {
        user,
        onChange
    } = props

    const [newIsAdmin, setNewIsAdmin] = useState(user.isAdmin)

    return <CheckBox checked={newIsAdmin} onChange={onIsAdminChanged}>
        Admin
    </CheckBox>

    function onIsAdminChanged(isAdmin: boolean) {
        setNewIsAdmin(isAdmin)
        onChange?.(user.withIsAdmin(isAdmin), user)
    }
}