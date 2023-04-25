export interface FileInputProps {
    accept?:    string
    autoFocus?: boolean
    disabled?:  boolean
    multiple?:  boolean
    onChange?:  OnFileInputChange
    children?:  string
}

export type OnFileInputChange = (newFiles: FileList | null) => void