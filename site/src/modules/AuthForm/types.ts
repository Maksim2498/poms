export interface AuthProps {
    onAuth?:   OnAuth
    onCancel?: OnCancelAuth
}

export type OnAuth       = () => void
export type OnCancelAuth = () => void