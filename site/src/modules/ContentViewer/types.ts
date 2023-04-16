import ReadonlyRefObject from "types/ReadonlyRefObject"

export type ContentStackContextType = [Content[], SetContentStack, ContentStackRef]
export type SetContentStack         = (newContentStack: Content[]) => void
export type ContentStackRef         = ReadonlyRefObject<Content[]>

export interface Content {
    name:        string
    selectName?: string
    editable?:   boolean
    component:   ContentComponent
}

export type ContentComponent = () => JSX.Element