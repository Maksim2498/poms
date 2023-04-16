import React from "react"

export interface Props<T extends React.ReactNode> {
    showIfEmpty?:     boolean
    header?:          string
    children:         T[]
    evalKey?:         EvalKey<T>
    itemClassName?:   string
    listClassName?:   string
    headerClassName?: string
}

export type EvalKey<T> = (value: T, index: number) => React.Key