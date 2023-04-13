export interface Content {
    name:        string
    selectName?: string
    editable?:   boolean
    component:   ContentComponent
}

export type ContentComponent = () => JSX.Element