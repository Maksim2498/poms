import { format } from "mysql"

export function expr(expression: string, ...values: any[]) {
    return new Expression(expression, ...values)
}

export default class Expression {
    readonly expression: string
    readonly values:     any[]

    constructor(expression: string, ...values: any[]) {
        this.expression = expression
        this.values     = values
    }

    toSql(): string {
        return format(this.expression, this.values)
    }
}