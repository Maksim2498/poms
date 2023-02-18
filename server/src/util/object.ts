import { TypeOfResult } from "./type"

export interface ValidationOptions {
    allowExcess?: boolean
    fields?: ({
        path:      string
        type?:     TypeOfResult | TypeOfResult[]
        required?: boolean
    } | string)[]
}

export type ValidationResult = {
    error: undefined
} | {
    error: "EXCESS"
    path:  string
} | {
    error: "MISSING"
    path:  string
} | {
    error:    "TYPE_MISMATCH"
    path:     string
    expected: TypeOfResult[]
    got:      TypeOfResult
}

export function validate(object: any, options?: ValidationOptions): ValidationResult {
    const VALID = { error: undefined }

    if (!options)
        return VALID

    const { allowExcess, fields } = normalizeOptions(options)

    // Check for excess

    if (!allowExcess) {
        const path = findExcessField(object, fields.map(field => field.path))

        if (path != null)
            return { error: "EXCESS", path }
    }

    // Check of missing required

    for (const { path, required} of fields)
        if (required && getField(object, path) === undefined)
            return { error: "MISSING", path }

    // Check for type missmatching

    for (const { path, type } of fields) {
        if (!type.length) // Any type
            continue

        const field = getField(object, path)

        if (field === undefined)
            continue

        const fieldType = typeof field

        if (!type.includes(fieldType))
            return {
                error:    "TYPE_MISMATCH",
                expected: type,
                got:      fieldType,
                path
            }
    }

    return VALID

    interface NoramlizedField {
        path:     string
        type:     TypeOfResult[]
        required: boolean
    }

    interface NormalizedOptions {
        allowExcess: boolean
        fields:      NoramlizedField[]
    }

    function normalizeOptions(options: ValidationOptions): NormalizedOptions {
        const normalized: NormalizedOptions = {
            allowExcess: options.allowExcess ?? false,
            fields:      []
        }

        if (!options.fields)
            return normalized

        for (const field of options.fields) {
            let normalizedField: NoramlizedField

            if (typeof field === "string")
                normalizedField = { path: field, required: false, type: [] }
            else
                normalizedField = {
                    path: field.path,
                    type: field.type ? Array.isArray(field.type) ? field.type
                                                                 : [field.type]
                                     : [],
                    required: field.required ?? false 
                }

            normalized.fields.push(normalizedField)
        }

        return normalized
    }
}

export function findExcessField(object: any, fieldPaths: string[]): string | undefined {
    const objectFieldPaths = getFieldPaths(object)

    const normalizedFieldPaths = normalizePaths(fieldPaths)
    
    for (const objectFieldPath of objectFieldPaths)
        if (!normalizedFieldPaths.has(objectFieldPath))
            return objectFieldPath;

    return undefined

    function normalizePaths(paths: string[]): Set<string> {
        const normalized = new Set<string>()

        for (const path of paths)
            for (const extended of extendPath(path))
                normalized.add(extended)

        return normalized
    }

    function extendPath(path: string): string[] {
        const subPaths = splitPath(path)
        const extended = [] as string[]

        for (let i = 1; i <= subPaths.length; ++i)
            extended.push(subPaths.slice(0, i).join("."))

        return extended
    }
}

export function getFieldPaths(object: any): string[] {
    if (!object)
        return []

    const paths: string[] = []

    for (const field in object) {
        const escapedField = field.replaceAll(".", "\\.")
        const value        = object[field]

        if (typeof value === "object") {
            const subPaths = getFieldPaths(value).map(subPath => `${escapedField}.${subPath}`)

            for (const subPath of subPaths)
                paths.push(subPath)
        }

        paths.push(escapedField)
    }

    return paths
}

export function getField(object: any, path: string): any {
    if (!object)
        return undefined

    const subPaths = splitPath(path)
    let   value    = object

    for (let i = 0; ; ++i) {
        value = value[subPaths[i]]

        if (i == subPaths.length - 1)
            break

        if (value == null)
            return undefined
    }

    return value
}

function splitPath(path: string): string[] {
    return path.split(/(?<!\\)\./)
}

export function deepAssign<T, F>(to: T, from: F): T & F {
    for (const field in from) {
        const val   = from[field]
        const anyTo = to as any

        anyTo[field] = typeof val === "object" ? deepAssign(anyTo[field] ?? {}, val)
                                               : val
    }

    return to as T & F
}