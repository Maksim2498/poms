import React from "react"

export interface ListProps<T extends React.ReactNode> {
    showIfEmpty?:     boolean
    header?:          string
    children:         T[]
    evalKey?:         EvalListKey<T>
    itemClassName?:   string
    listClassName?:   string
    headerClassName?: string
}

export type EvalListKey<T> = (value: T, index: number) => React.Key