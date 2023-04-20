import Button                              from "ui/Button/Component"
import Modal                               from "ui/Modal/Component"
import MaxUserNicknamesContext             from "./Context"
import styles                              from "./styles.module.css"

import { useState, useContext, useEffect } from "react"
import { InputAnswerState                } from "ui/Modal/types"
import { UserNicknamesProps              } from "./types"

export default function UserNicknames(props: UserNicknamesProps) {
    const {
        user,
        editMode,
        onChange
    } = props

    const maxNicknames              = useContext(MaxUserNicknamesContext)
    const [nicknames, setNicknames] = useState(user.nicknames ?? [])
    const [adding,    setAdding   ] = useState(false)

    useEffect(() => {
        setNicknames(user.nicknames ?? [])
        setAdding(false)
    }, [editMode, user])

    if (!editMode && !nicknames.length)
        return null

    return <div className={styles.container}>
        <div className={styles.header}>Nicknames {editMode && `(${nicknames.length}/${maxNicknames})`}</div>

        <ul className={editMode ? styles.editableList : styles.list}>
            {nicknames.map((nickname, i) => <li key={nickname} className={styles.item}>
                <div className={styles.nickname}>{nickname}</div>
                {editMode && <Button color="red" onClick={() => onDelete(i)}>Delete</Button>}
            </li>)}
        </ul>
        
        {
            editMode && nicknames.length < maxNicknames && <div className={styles.add}>
                <Button color="green" onClick={() => setAdding(true)}>
                    Add nickname
                </Button>
            </div>
        }

        {
            adding && <Modal header="Nickname Adding">
                {{
                    nickname: {
                        type:        "input",
                        placeholder: "Nickname",
                        format:      nickname => nickname.trim(),
                        validate:    validateNickname
                    },

                    cancel: {
                        type:        "button",
                        text:        "Cancel",
                        onClick:     () => setAdding(false),
                        autoFocus:   true
                    },

                    add: {
                        type:        "button",
                        color:       "green",
                        text:        "Add",
                        onClick:     states => onAdd((states.nickname as InputAnswerState).value)
                    }
                }}
            </Modal>
        }
    </div>

    function onDelete(i: number) {
        const newNicknames = nicknames.filter((_, j) => i !== j)

        setNicknames(newNicknames)
        onChange?.(user.withNicknames(newNicknames), user)
    }

    function validateNickname(nickname: string): string | undefined {
        if (!nickname.length)
            return "Cannot be a blank string"

        if (nicknames.includes(nickname))
            return `"${nickname}" alredy exists`

        return
    }

    function onAdd(nickname: string) {
        setAdding(false)

        if (!nickname.length)
            return

        const newNicknames = [...nicknames, nickname]

        setNicknames(newNicknames)
        onChange?.(user.withNicknames(newNicknames), user)
    }
}