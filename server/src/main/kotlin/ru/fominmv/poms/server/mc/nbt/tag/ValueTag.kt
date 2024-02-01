package ru.fominmv.poms.server.mc.nbt.tag

import ru.fominmv.poms.server.util.text.stringext.declaration

sealed class ValueTag<out T> : Tag {
    abstract val value: T

    override fun toString(): String {
        val tagName     = javaClass.simpleName
        val name        = this.name.declaration()
        val value       = this.value
        val valueString = if (value is String)
            value.declaration()
        else
            value.toString()

        return "$tagName($name): $valueString"
    }
}