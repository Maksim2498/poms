import { DeepReadonly } from "util/type"

export interface Table {
    name:         string
    columns:      Column[]
    constraints?: Constraint[]
}

export interface Column {
    name:          string
    type:          Type
    nullable?:     boolean
    unique?:       boolean
    primaryKey?:   boolean
    defaultValue?: DefaultValue
    autoIncement?: boolean
}

export type DefaultValue = null
                         | string
                         | boolean
                         | number
                         | {
                             special: "current_timestamp"
                         }

export const current_timestamp: DefaultValue = { special: "current_timestamp" }

export type Constraint = ForeignKeyConstraint
                       | PrimaryKeyConstraint
                       | UniqueConstraint

export type ForeignKeyConstraint = {
    name?:     string
    type:      "foreign_key"
    field:     string
    refTable:  string
    refField:  string
    onDelete?: OnDelete
}

export type OnDelete = "null" | "cascade"

export type PrimaryKeyConstraint = {
    name?: string
    type:  "primary_key"
    fields: string[]
}

export type UniqueConstraint = {
    name?:  string
    type:   "unique"
    fields: string[]
}

export type Type = SizelessType
                 | SizedType
                 | EnumType

export type SizelessType = {
    name: SizelessTypeName
}

export type SizedType = {
    name:  SizedTypeName
    size?: number
}

export type EnumType = {
    name:     "enum"
    variants: string[]
}

export type TypeName = SizedTypeName | SizelessTypeName

export type SizedTypeName = "tinyint"
                          | "bigint"
                          | "varchar"
                          | "binary"

export type SizelessTypeName = "boolean"
                             | "timestamp"

export const boolean:   Type = { name: "boolean"   }
export const timestamp: Type = { name: "timestamp" }
export const tinyint:   Type = { name: "tinyint"   }
export const bigint:    Type = { name: "bigint"    }
export const varchar:   Type = { name: "varchar"   }
export const binary:    Type = { name: "binary"    }

export function mkTinyint(size?: number): SizedType {
    return mkSizedType("tinyint", size)
}

export function mgVigint(size?: number): SizedType {
    return mkSizedType("bigint", size)
}

export function mkVarchar(size?: number): SizedType {
    return mkSizedType("varchar", size)
}

export function mkBinary(size?: number): SizedType {
    return mkSizedType("binary", size)
}

function mkSizedType(name: SizedTypeName, size?: number): SizedType {
    return size == null ? { name       }
                        : { name, size }
}

export function mkEnum(...variants: string[]): EnumType {
    return { name: "enum", variants }
}

export function tableToSQL(table: DeepReadonly<Table>): string {
    return `CREATE TABLE ${table.name.trim()} (\n`
          + makeArgs().map(a => `    ${a}`).join(",\n")
          + "\n)"

    function makeArgs(): string[] {
        return [
            ...columnsToStrings(),
            ...constaintsToStrings()
        ]
    }
    
    function columnsToStrings(): string[] {
        return table.columns.map(c => columnToSQL(c))
    }

    function constaintsToStrings(): string[] {
        return table.constraints?.map(c => constraintToSQL(c)) ?? []
    }
}

export function columnToSQL(column: DeepReadonly<Column>): string {
    return `${column.name} ${typeToSQL(column.type)}`
          + (column.nullable                   ? " NULL"                                         : " NOT NULL")
          + (column.unique                     ? " UNIQUE"                                       : ""         )
          + (column.primaryKey                 ? " PRIMARY KEY"                                  : ""         )
          + (column.autoIncement               ? " AUTO_INCREMENT"                               : ""         )
          + (column.defaultValue !== undefined ? ` DEFAULT ${defaultToSQL(column.defaultValue)}` : ""         )
}

export function typeToSQL(type: DeepReadonly<Type>, charCase: "lower" | "upper" = "upper"): string {
    if ("size" in type) {
        const name = charCase == "lower" ? type.name : type.name.toUpperCase()
        return `${name}(${type.size})`
    }

    if (type.name === "enum") {
        const name = charCase == "lower" ? "enum" : "ENUM"
        return `${name}(${type.variants.map(v => `'${v}'`).join(",")})`
    }

    return type.name === "boolean" ? charCase === "lower" ? "tinyint(1)" : "TINYINT(1)"
                                   : charCase === "lower" ? type.name    : type.name.toUpperCase()
}

export function defaultToSQL(value: DeepReadonly<DefaultValue>): string {
    switch (typeof value) {
        case "number":
            return String(value)

        case "object":
            if (value === null)
                return  "NULL"

            return  "CURRENT_TIMESTAMP"

        case "string":
            return `"${value}"`

        case "boolean":
            return value ? "TRUE" : "FALSE"
    }
}

export function constraintToSQL(constraint: DeepReadonly<Constraint>): string {
    switch (constraint.type) {
        case "foreign_key": {
            const field    = constraint.field.trim()
            const refTable = constraint.refTable.trim()
            const refField = constraint.refField.trim()
            const onDelete = constraint.onDelete === "null" ? "SET NULL" : "CASCADE"
            const postfix  = `FOREIGN KEY (${field}) REFERENCES ${refTable} (${refField}) ON DELETE ${onDelete}`

            return constraint.name ? `CONSTRAINT ${constraint.name.trim()} ${postfix}`
                                   : postfix
        }

        case "primary_key": {
            const fields  = constraint.fields.join(", ")
            const postfix = `PRIMARY KEY (${fields})`

            return constraint.name ? `CONSTRAINT ${constraint.name.trim()} ${postfix}`
                                   : postfix
        }

        case "unique": {
            const fields  = constraint.fields.join(", ")
            const postfix = `UNIQUE ${fields}`

            return constraint.name ? `CONSTRAINT ${constraint.name.trim()} ${postfix}`
                                   : postfix
        }
    }
}

export function tableFieldToSQLKey(table: DeepReadonly<Table>, field: string): "MUL" | "PRI" | "UNI" | "" {
    const trimedField = field.trim()
    const column      = findColumn()

    if (column == null)
        return ""

    if (column.primaryKey)
        return "PRI"

    let unique     = column.unique ?? false
    let foreignKey = false

    for (const constraint of findConstraints())
        switch (constraint.type) {
            case "foreign_key":
                foreignKey = true
                break

            case "unique":
                unique = true
                break

            case "primary_key":
                return "PRI"
        }

    const sum = Number(unique) + Number(foreignKey)

    if (sum === 0)
        return ""

    if (sum > 1)
        return "MUL"

    if (unique)
        return "UNI"

    return "MUL"

    function findColumn(): DeepReadonly<Column> | undefined {
        for (const column of table.columns)
            if (column.name.trim() === trimedField)
                return column

        return undefined
    }

    function findConstraints(): DeepReadonly<Constraint>[] {
        if (table.constraints == null)
            return []

        const constraints: DeepReadonly<Constraint>[] = []

        for (const constraint of table.constraints)
            switch (constraint.type) {
                case "foreign_key":
                    if (constraint.field.trim() === trimedField)
                            constraints.push(constraint)

                    break

                case "primary_key":
                case "unique":
                    if (constraint.fields.map(f => f.trim()).includes(trimedField))
                        constraints.push(constraint)
            }


        return constraints
    }
}