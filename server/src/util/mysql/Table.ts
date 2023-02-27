import mysql           from "mysql"
import AsyncConnection from "./AsyncConnection"
import Expression      from "./Expression"

import { deepAssign                                           } from "util/object"
import { expr                                                 } from "./Expression"
import { Type, EnumType, SizedType, SizelessType, isNameValid } from "./type"

import * as s from "./statement"

// Column:

export type AddColumnOptions = {
    primaryKey?:    false
    name:           string
    type:           Type
    autoIncrement?: boolean
    defaultValue?:  DefaultValue
    nullable?:      boolean
    unique?:        boolean
} | {
    primaryKey:     true
    name:           string
    type:           Type
    autoIncrement?: boolean
    defaultValue?:  DefaultValue
}

export interface Column {
    readonly table:         ReadonlyTable
    readonly displayName:   string
    readonly name:          string
    readonly type:          Type
    readonly primaryKey:    boolean
    readonly nullable:      boolean
    readonly unique:        boolean
    readonly autoIncrement: boolean
    readonly defaultValue?: DefaultValue
}

// Default Value:

export type DefaultValue = number
                         | string
                         | boolean
                         | null
                         | Expression
                        
export const CURRENT_TIMESTAMP = expr("CURRENT_TIMESTAMP")

// Constraint:

export type Constraint = ForeignKeyConstraint
                       | PrimaryKeyConstraint
                       | UniqueConstraint

export type ForeignKeyConstraint = {
    table:     ReadonlyTable
    type:      "foreign_key"
    column:    string
    refTable:  Table
    refColumn: string
    onDelete?: OnDelete
}

export type OnDelete = "null" | "cascade"

export type PrimaryKeyConstraint = {
    table:    ReadonlyTable
    type:    "primary_key"
    columns: string[]
}

export type UniqueConstraint = {
    table:    ReadonlyTable
    type:    "unique"
    columns: string[]
}

// Query

export interface InsertPairs {
    [key: string]: any
}

export interface Filter {
    all(): Promise<any[]>
    where(expr: string, ...values: any[]): Promise<any[]>
}

// Table:

export interface ReadonlyTable {
    readonly displayName:    string
    readonly name:           string
    readonly columns:        ReadonlyMap<string, Column>
    readonly constraints:    ReadonlySet<Constraint>
    readonly referencedFrom: ReadonlyMap<string, ReadonlyTable>

    recreate(connection: AsyncConnection): Promise<void>
    dropAll(connection: AsyncConnection): Promise<void>
    drop(connection: AsyncConnection): Promise<void>
    clear(connection: AsyncConnection): Promise<void>
    createAll(connection: AsyncConnection): Promise<void>
    create(connection: AsyncConnection): Promise<void>
    validate(connection: AsyncConnection): Promise<string | undefined>
    insert(connection: AsyncConnection, insertPairs: InsertPairs): Promise<boolean>
    select(connection: AsyncConnection, ...columns: string[]): Filter
    delete(conneciton: AsyncConnection): Filter
    columnConstraints(column: string): Constraint[]

    toSql(): string
}

export default class Table {
    private readonly _columns:        Map<string, Column>        = new Map()
    private readonly _constraints:    Set<Constraint>            = new Set()
    private readonly _referencedFrom: Map<string, ReadonlyTable> = new Map()

    readonly displayName: string
    readonly name:        string

    constructor(name: string) {
        if (!isNameValid(name))
            throw new Error(`Table name "${name}" is invaild`)

        this.displayName = name
        this.name        = name.toLowerCase()
    }

    get columns(): ReadonlyMap<string, Column> {
        return this._columns
    }

    get constraints(): ReadonlySet<Constraint> {
        return this._constraints
    }

    get referencedFrom(): ReadonlyMap<string, ReadonlyTable> {
        return this._referencedFrom
    }

    addColumn(column: AddColumnOptions): this {
        if (!isNameValid(column.name))
            throw new Error(`Column name "${column.name}" is invalid`)

        const name = column.name.toLowerCase()

        if (this._columns.has(name))
            throw new Error(`Column "${column.name}" already exists`)

        this._columns.set(
            name, 
            column.primaryKey ? {
                name,
                table:         this,
                displayName:   column.name,
                type:          column.type,
                primaryKey:    true,
                nullable:      false,
                unique:        false,
                autoIncrement: column.autoIncrement ?? false,
                defaultValue:  column.defaultValue
            } : {
                name,
                table:         this,
                displayName:   column.name,
                type:          column.type,
                primaryKey:    false,
                nullable:      column.nullable      ?? false,
                unique:        column.unique        ?? false,
                autoIncrement: column.autoIncrement ?? false,
                defaultValue:  column.defaultValue
            }
        )

        return this
    }

    addForeignKey(column: string, refTable: Table, refColumn: string, onDelete?: OnDelete): this {
        return this.addConstraint({ table: this, type: "foreign_key", column, refTable, refColumn, onDelete })
    }

    addPrimaryKey(...columns: string[]): this {
        return this.addConstraint({ table: this, type: "primary_key", columns })
    }

    addUnique(...columns: string[]): this {
        return this.addConstraint({ table: this, type: "unique", columns })
    }

    addConstraint(constraint: Constraint): this {
        switch (constraint.type) {
            case "foreign_key":
                if (!this.columns.has(constraint.column))
                    this.missingColumn(constraint.column)

                if (!constraint.refTable.columns.has(constraint.refColumn))
                    constraint.refTable.missingColumn(constraint.refColumn)

                constraint.refTable._referencedFrom.set(this.name, this)

                break

            case"primary_key":
            case "unique":
                for (const column of constraint.columns)
                    if (!this.columns.has(column))
                        this.missingColumn(column)
        }

        this._constraints.add(deepAssign({}, constraint))

        return this
    }

    async recreate(connection: AsyncConnection) {
        await this.dropAll(connection)
        await this.createAll(connection)
    }

    async dropAll(connection: AsyncConnection) {
        for (const table of this.referencedFrom.values())
            if (table != this)
                await table.dropAll(connection)

        await this.drop(connection)
    }

    async drop(connection: AsyncConnection) {
        await s.dropTable(connection, this.displayName)
    }

    async clear(connection: AsyncConnection) {
        await s.clearTable(connection, this.displayName)
    }

    async createAll(connection: AsyncConnection) {
        await this.create(connection)

        for (const table of this.referencedFrom.values())
            if (table != this)
                await table.createAll(connection)
    }

    async create(conneciton: AsyncConnection) {
        conneciton.logger?.info(`Creating table "${this.displayName}"...`)
        await conneciton.query(this.toSql())
        conneciton.logger?.info("Created")
    }

    async validate(connection: AsyncConnection): Promise<string | undefined> {
        return await connection.query(
            "DESC ??",
            this.displayName,
            (results: any[]) => {
                if (results.length < this.columns.size)
                    return "Too few columns"

                const checked = [] as string[]

                for (const { Field, Type, Null, Key, Default, Extra } of results) {
                    const column = this.columns.get(Field.toLowerCase())

                    if (column == null)
                        continue

                    const expectedType = Table.typeToSql(column.type)

                    if (Type !== expectedType)
                        return `Invalid type in column "${column.displayName}". Expected: ${expectedType}. Got: ${Type}`

                    const gotNullable = Null === "YES"

                    if (gotNullable != column.nullable)
                        return `Invaild nullability in column "${column.displayName}". Expected: ${column.nullable}. Got: ${gotNullable}`

                    const expectedDefault = Table.defaultValueToDescResult(column.defaultValue)

                    if (Default != expectedDefault)
                        return `Invalid default value in column "${column.displayName}". Expected: ${expectedDefault}. Got: ${Default}`

                    const expectedKey = this.columnToDescKey(column)

                    if (Key != expectedKey)
                        return `Invalid key in column "${column.displayName}". Expected ${expectedKey}. Got: ${Key}`

                    if (column.autoIncrement && Extra !== "auto_increment")
                        return `Missing auto_increment extra in column "${column.displayName}"`

                    checked.push(column.name)
                }

                for (const column of this.columns.keys())
                    if (!checked.includes(column))
                        return `Missing column "${this.columns.get(column)!.displayName}"`

                return undefined;
            }
        )
    }

    private static defaultValueToDescResult(value?: DefaultValue): any {
        if (value == null)
            return null

        switch (typeof value) {
            case "boolean":
                return Number(value)
            
            case "object":
                if (value.expression.trim().toLowerCase() === "current_timestamp")
                    return "now()"

                return value.expression.trim()
                                       .replaceAll(/\s+/g, "")
                                       .toLowerCase()

            default:
                return value
        }
    }

    private columnToDescKey(column: Column): "MUL" | "PRI" | "UNI" | "" {
        if (column.primaryKey)
            return "PRI"

        let foreignKey = false
        let uniqueKey  = column.unique
    
        for (const constraint of this.columnConstraints(column.name))
            switch (constraint.type) {
                case "foreign_key":
                    foreignKey = true
                    break
    
                case "unique":
                    uniqueKey = true
                    break
    
                case "primary_key":
                    return "PRI"
            }

        if (uniqueKey)
            return "UNI"

        if (foreignKey)
            return "MUL"
    
        return ""
    }

    columnConstraints(column: string): Constraint[] {
        const constraints = [] as Constraint[]

        column = column.toLowerCase()

        for (const constraint of this.constraints)
            switch (constraint.type) {
                case "foreign_key":
                    if (constraint.column === column)
                        constraints.push(constraint)

                    break

                case "primary_key":
                case "unique":
                    if (constraint.columns.includes(column))
                        constraints.push(constraint)
            }

        return constraints
    }

    async insert(connection: AsyncConnection, insertPairs: InsertPairs): Promise<boolean> {
        const { columns, expressions } = this.insertPairsToColumnListAndExpressionList(insertPairs)
        const columnsSql               = this.queryColumnsToSql(columns)
        const expressionsSql           = expressions.join(", ")

        return await connection.query(
            `INSERT INTO ${this.displayName} (${columnsSql}) VALUES (${expressionsSql})`,
            [],
            ()    => true,
            error => error.code === "ER_DUP_ENTRY" ? false : undefined
        )
    }

    private insertPairsToColumnListAndExpressionList(insertPairs: InsertPairs): { columns: string[], expressions: string[] } {
        return {
            columns:     makeColumns(),
            expressions: makeExpressions()
        }

        function makeColumns(): string[] {
            const columns = [] as string[]

            for (const column in insertPairs)
                columns.push(column)

            return columns
        }

        function makeExpressions(): string[] {
            const expressions = [] as string[]

            for (const column in insertPairs) {
                const expression = insertPairs[column]

                if (expression instanceof Expression) {
                    expressions.push(expression.toSql())
                    continue
                }

                expressions.push(mysql.escape(expression))
            }

            return expressions
        }
    }

    select(connection: AsyncConnection, ...columns: string[]): Filter {
        const columnsSql = this.queryColumnsToSql(columns)

        return {
            all:   async ()                => await connection.query(`SELECT ${columnsSql} FROM ${this.displayName}`                      ),
            where: async (expr, ...values) => await connection.query(`SELECT ${columnsSql} FROM ${this.displayName} WHERE ${expr}`, values)
        }
    }

    private queryColumnsToSql(columns: string[]): string {
        for (const column of columns)
            if (!this.columns.has(column.toLowerCase()))
                this.missingColumn(column)
            
        return columns.length !== 0 ? columns.join(", ") : "*"
    }

    delete(conneciton: AsyncConnection): Filter {
        return {
            all:   async ()                => await conneciton.query(`DELETE FROM ${this.displayName}`                      ),
            where: async (expr, ...values) => await conneciton.query(`DELETE FROM ${this.displayName} WHERE ${expr}`, values)
        }
    }

    toSql(): string {
        return `CREATE TABLE ${this.displayName} (\n`
             + this.makeSqlArgs().map(a => "    " + a).join(",\n")
             + "\n)"

    }

    private makeSqlArgs(): string[] {
        return [
            ...this.columnsToSql(),
            ...this.constrantsToSql()
        ]
    }

    private columnsToSql(): string[] {
        const sql = [] as string[]

        for (const column of this.columns.values())
            sql.push(Table.columnToSql(column))

        return sql
    }

    private static columnToSql(column: Column): string {
        const items = [
            column.displayName,
            this.typeToSql(column.type),
            this.nullableToSql(column.nullable)
        ]

        if (column.unique)
            items.push("UNIQUE")

        if (column.primaryKey)
            items.push("PRIMARY KEY")

        if (column.autoIncrement)
            items.push("AUTO_INCREMENT")

        if (column.defaultValue !== undefined)
            items.push(this.defaultToSql(column.defaultValue))

        return items.join(" ")
    }

    private static typeToSql(type: Type): string {
        if (type.name === "enum")
            return this.enumTypeToSql(type)

        if ("size" in type)
            return this.sizedTypedToSql(type)
    
        return this.sizelessTypeToSql(type)
    }

    private static enumTypeToSql(type: EnumType): string {
        const variants = type.variants.map(v => `'${escape(v)}'`)
                                      .join(",")

        return `enum(${variants})`

        function escape(variant: string): string {
            return variant.replaceAll('"', '\\"')
                          .replaceAll("\n", "\\n")
        }
    }

    private static sizedTypedToSql(type: SizedType): string {
        return type.size == null ? type.name
                                 : `${type.name}(${type.size})`
    }

    private static sizelessTypeToSql(type: SizelessType): string {
        return type.name
    }

    private static nullableToSql(nullable: boolean): string {
        return nullable ? "NULL" : "NOT NULL"
    }

    private static defaultToSql(value?: DefaultValue): string {
        const PREFIX = "DEFAULT "

        if (value == null)
            return PREFIX + "NULL"

        switch (typeof value) {
            case "number":
                return PREFIX + value

            case "string":
                return PREFIX + value

            case "boolean":
                return PREFIX + value.toString().toUpperCase()

            case "object":
                return `${PREFIX}(${value.toSql()})`
        }
    }

    private constrantsToSql(): string[] {
        const sql = [] as string[]

        for (const constraint of this.constraints)
            sql.push(Table.constraintToSql(constraint))

        return sql
    }

    private static constraintToSql(constraint: Constraint): string {
        switch (constraint.type) {
            case "foreign_key":
                const column    = constraint.column
                const refTable  = constraint.refTable.displayName
                const refColumn = constraint.refColumn
                const onDelete  = this.onDeleteToSql(constraint.onDelete)

                return `FOREIGN KEY (${column}) REFERENCES ${refTable} (${refColumn}) ON DELETE ${onDelete}`

            case "primary_key":
                return `PRIMARY KEY (${constraint.columns.join(", ")})`

            case "unique":
                return `UNIQUE KEY (${constraint.columns.join(", ")})`
        }
    }

    private static onDeleteToSql(onDelete?: OnDelete): string {
        return onDelete == null || onDelete === "cascade" ? "CASCADE"
                                                          : "SET NULL"
    }

    private missingColumn(column: string) {
        throw new Error(`Column "${column}" isn't presented in table "${this.displayName}"`)
    }

    toString(): string {
        return this.displayName
    }
}