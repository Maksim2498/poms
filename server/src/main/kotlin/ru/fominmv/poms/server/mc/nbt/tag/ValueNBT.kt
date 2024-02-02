package ru.fominmv.poms.server.mc.nbt.tag

import ru.fominmv.poms.server.util.text.stringext.declaration

sealed class ValueNBT<out T> : NBT {
    abstract val value: T

    override fun toString(): String {
        val nbtName     = javaClass.simpleName
        val name        = this.name.declaration()
        val value       = this.value
        val valueString = if (value is String)
            value.declaration()
        else
            value.toString()

        return "$nbtName($name): $valueString"
    }
}