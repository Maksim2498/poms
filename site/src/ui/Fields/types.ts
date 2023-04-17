export interface FieldsProps {
    showIfEmpty?: boolean
    header?:      string
    children:     Rows
}

export type Rows = {
    [label: string]: any
}