export interface Content {
    name:        string
    selectName?: string
    component:   ContentComponent
}

export type ContentComponent = () => JSX.Element