import Dim            from "ui/Dim/Component"
import Button         from "ui/Button/Component"
import styles         from "./styles.module.css"

import { useState   } from "react"
import { ModalProps } from "./types"

export default function Modal(props: ModalProps) {
    const {
        header,
        question,
        children: answers
    } = props

    const [loading, setLoading] = useState(false)

    return <div className={styles.container}>
        <Dim />
        <div className={styles.modal}>
            {header   && <h3  className={styles.header  }>{header  }</h3> }
            {question && <div className={styles.question}>{question}</div>}
            <div className={styles.answers}>
                {answers && answers.map(({ text, color, onClick, autoFocus }) => {
                    const key = `${text}/${color}`

                    return <Button key={key} color={color} disabled={loading} onClick={rawOnClick} autoFocus={autoFocus}>
                        {text}
                    </Button>

                    async function rawOnClick() {
                        const result = onClick?.()

                        if (result instanceof Promise) {
                            setLoading(true)

                            try {
                                await result
                            } catch (error) {
                                console.error(error)
                            }

                            setLoading(false)
                        }
                    }
                })}
            </div>
        </div>
    </div>
}