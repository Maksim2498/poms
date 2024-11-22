package ru.fominmv.poms.libs.commons.strings

import ru.fominmv.poms.libs.commons.reflection.allDeclaredFields

import java.lang.reflect.Modifier

// Annotations

@MustBeDocumented
@Target(AnnotationTarget.FIELD)
annotation class Hidden

@MustBeDocumented
@Target(AnnotationTarget.FIELD)
annotation class Secret

@MustBeDocumented
@Target(AnnotationTarget.FIELD)
annotation class Renamed(val field: String)

// To

fun Any.toObjectString(
    showSynthetic: Boolean = false,
    showDelegates: Boolean = false,
    showStatic: Boolean = false
): String {
    val any = this
    val anyClass = javaClass
    val fields = buildMap {
        for (field in anyClass.allDeclaredFields) {
            if (!field.trySetAccessible())
                continue

            if (!showSynthetic && field.isSynthetic)
                continue

            if (!showDelegates && field.name.endsWith("\$delegate"))
                continue

            if (!showStatic && Modifier.isStatic(field.modifiers))
                continue

            if (field.getAnnotation(Hidden::class.java) != null)
                continue

            val fieldName = field.getAnnotation(Renamed::class.java)?.run { this.field }
                ?: field.name

            val fieldValue = if (field.getAnnotation(Secret::class.java) != null)
                "[PROTECTED]"
            else
                field.get(any)

            put(fieldName, fieldValue)
        }
    }

    return createObjectString(any, fields)
}

fun Any.toObjectString(fields: Map<String, Any?>): String =
    createObjectString(this, fields)

// Create

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
