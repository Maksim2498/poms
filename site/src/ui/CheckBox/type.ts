export interface CheckBoxProps {
    checked?:      boolean
    onChange?:     OnCheckBoxChange
    disabled?:     boolean
    autoFocus?:    boolean
    autoComplete?: string
}

export type OnCheckBoxChange = (value: boolean) => void