import Input                   from "ui/Input/Component"
import styles                  from "./styles.module.css"

import { useState, useEffect } from "react"
import { UserNameProps       } from "./types"

export default function UserName(props: UserNameProps) {
    const {
        editMode,
        user,
        onChange
    } = props

    const { name, login } = user

    const [newName, setNewName] = useState(name ?? "")

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => setNewName(name ?? ""), [editMode])

    return editMode ? <Input placeholder="User name" value={newName} onChange={onNameChange} />
                    : <span className={styles.name}>{name ?? login}</span>

    function onNameChange(name: string) {
        setNewName(name)
        onChange?.(user.withName(name), user)
    }
}