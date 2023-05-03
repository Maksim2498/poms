import { MutableRefObject } from "react"

export type ContentStackContextType = MutableRefObject<Content[]>

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