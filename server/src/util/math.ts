export function max(lhs: any, rhs: any): typeof lhs | typeof rhs {
    return lhs >= rhs ? lhs : rhs
}

export function min(lhs: any, rhs: any): typeof lhs | typeof rhs {
    return lhs <= rhs ? lhs : rhs
}
