package ru.fominmv.poms.libs.commons.reflection

import java.lang.reflect.Field

val Class<*>.allDeclaredFields: List<Field>
    get() {
        val fields = mutableListOf<Field>()

        var clazz: Class<*>? = this

        do {
            fields.addAll(clazz!!.declaredFields)
            clazz = clazz.superclass
        } while (clazz != null)

        return fields
    }
