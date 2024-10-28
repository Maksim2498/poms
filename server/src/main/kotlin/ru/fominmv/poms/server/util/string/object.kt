package ru.fominmv.poms.server.util.string

import ru.fominmv.poms.server.util.reflection.allDeclaredFields

@MustBeDocumented
@Target(AnnotationTarget.FIELD)
annotation class Hidden

fun Any.toObjectString(): String {
    val any = this
    val anyClass = javaClass
    val fields = buildMap {
        for (field in anyClass.allDeclaredFields) {
            if (!field.trySetAccessible())
                continue

            if (field.getAnnotation(Hidden::class.java) != null)
                continue

            put(field.name, field.get(any))
        }
    }

    return createObjectString(any, fields)
}

fun Any.toObjectString(fields: Map<String, Any?>): String =
    createObjectString(this, fields)

fun createObjectString(any: Any, fields: Map<String, Any?>): String =
    createObjectString(any.javaClass, fields)

fun createObjectString(anyClass: Class<*>, fields: Map<String, Any?>): String =
    createObjectString(
        anyClass.simpleName.ifBlank { anyClass.name },
        fields,
    )

fun createObjectString(name: String, fields: Map<String, Any?>): String {
    val fieldStrings = fields.map { "${it.key}=${it.value}" }
    val joinedFields = fieldStrings.joinToString(", ")

    return "$name($joinedFields)"
}
