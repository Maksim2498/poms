import AuthInfo      from "logic/AuthInfo"
import Input         from "ui/Input/Component"
import Button        from "ui/Button/Component"

import { FormEvent } from "react"

import "./style.css"

export interface Props {
    onAuth?:   OnAuth
    onCancel?: OnCancelAuth
}

export type OnAuth       = (authInfo: AuthInfo) => void
export type OnCancelAuth = () => void

export default function AuthFrom(props: Props) {
    const { onCancel } = props

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
    }

    return <form className="AuthForm" onSubmit={onSubmit}>
        <fieldset>
            <legend>Sign In</legend>
            <Input placeholder="Login" />
            <Input placeholder="Password" type="password" />
            <div className="buttons">
                <Button type="cancel" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Sign In</Button>
            </div>
        </fieldset>
    </form>
}