import User                    from "logic/User"
import FormErrorText           from "ui/FormErrorText/Component"
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
    const [error,   setError  ] = useState(undefined as any)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => setNewName(name ?? ""), [editMode])

    if (editMode)
        return <div className={styles.editableName}>
            <Input placeholder="User name" value={newName} onChange={onNameChange} />
            <FormErrorText>{error}</FormErrorText>
        </div>

    return <span className={styles.name}>{name ?? login}</span>

    function onNameChange(name: string) {
        const newError = User.validateName(name)

        setError(newError)
        setNewName(name)

        if (newError == null)
            onChange?.(user.withName(name), user)
    }
}