import ReadonlyRefObject from "types/ReadonlyRefObject"

export type ContentStackContextType = [Content[], SetContentStack, ContentStackRef]
export type SetContentStack         = (newContentStack: Content[]) => void
export type ContentStackRef         = ReadonlyRefObject<Content[]>

export interface Content {
    readonly name:        string
    readonly selectName?: string
    readonly editable?:   boolean
    readonly component:   ContentComponent
}

export type ContentComponent = (props: ContentComponentProps) => JSX.Element

export interface ContentComponentProps {
    editMode?: boolean
}