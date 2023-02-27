export type Type = EnumType
                 | SizelessType
                 | SizedType

export type EnumType = {
    name:     "enum"
    variants: string[]
}

export type SizelessType = {
    name: SizelessTypeName
}

export type SizedType = {
    name: SizedTypeName
    size: number | null
}

export type TypeName = SizedTypeName | SizelessTypeName

export type SizedTypeName = "tinyint"
                          | "bigint"
                          | "varchar"
                          | "binary"

export type SizelessTypeName = "timestamp"

export function boolean(): Type {
    return tinyint(1)
}

export function timestamp(): Type {
    return { name: "timestamp" }
}

export function tinyint(size?: number): Type {
    return { name: "tinyint", size: size ?? null }
}

export function bigint(size?: number): Type {
    return { name: "bigint", size: size ?? null }
}

export function varchar(size?: number): Type {
    return { name: "varchar", size: size ?? null }
}

export function binary(size?: number): Type {
    return { name: "binary", size: size ?? null }
}

export function enumeration(...variants: string[]): Type {
    return { name: "enum", variants }
}

export function isNameValid(name: string) {
    return name.match(/^\w+$/)
}