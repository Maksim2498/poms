package ru.fominmv.poms.libs.commons.text.strings.objs

import ru.fominmv.poms.libs.commons.reflection.allDeclaredFields

import java.lang.reflect.Modifier

// To

fun Any.toObjString(
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

            val fieldName = field.getAnnotation(Renamed::class.java)?.field ?: field.name
            val fieldValue = field.getAnnotation(Secret::class.java).formatNullable(field.get(any))

            put(fieldName, fieldValue)
        }
    }

    return createObjString(any, fields)
}

fun Any.toObjString(fields: Map<String, Any?>): String =
    createObjString(this, fields)

// Create

fun createObjString(any: Any, fields: Map<String, Any?>): String =
    createObjString(any.javaClass, fields)

fun createObjString(anyClass: Class<*>, fields: Map<String, Any?>): String =
    createObjString(
        anyClass.simpleName.ifBlank { anyClass.name },
        fields,
    )

fun createObjString(name: String, fields: Map<String, Any?>): String {
    val fieldStrings = fields.map { "${it.key}=${it.value}" }
    val joinedFields = fieldStrings.joinToString(", ")

    return "$name($joinedFields)"
}
