package ru.fominmv.poms.libs.mc.nbt.tags

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration

/**
 * A base class for all classes representing a NBT tag holding only one value
 *
 * @param T the type of the value held by this NBT tag
 */
sealed class ValueNbt<out T> : Nbt {
    /**
     * A value held by this NBT tag
     */
    abstract val value: T

    // equals and hashCode methods not were not overridden
    // because all derived classes are data classes

    /**
     * Converts this NBT tag to the string of form "<class name>(<name>): <value>"
     *
     * @return a string representation of this NBT tag
     */
    override fun toString(): String =
        buildString {
            append(this@ValueNbt.javaClass.simpleName)

            append('(')
            append(name.declaration())
            append("): ")

            append(
                value.let {
                    if (it is String)
                        it.declaration()
                    else
                        it.toString()
                }
            )
        }
}
