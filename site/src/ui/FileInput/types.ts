export interface FileInputProps {
    accept?:    string
    autoFocus?: boolean
    disabled?:  boolean
    multiple?:  boolean
    onChange?:  OnFileInputChanged
    children?:  string
}

export type OnFileInputChanged = (newFiles: FileList | null) => void