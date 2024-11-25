package ru.fominmv.poms.libs.mc.nbt.tags

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration

import java.util.Objects

/**
 * A base class for all classes representing a NBT tag holding a collection of the elements
 *
 * @param Values the type of the collection held by this NBT tag
 */
sealed class CollectionNbt<out Values : Collection<*>> : Nbt {
    /**
     * Collection of the elements held by this NBT tag
     */
    abstract val values: Values

    // Equality check

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass == other?.javaClass)
            return true

        other as CollectionNbt<*>

        return name == other.name &&
               values == other.values
    }

    override fun hashCode(): Int =
        Objects.hash(name, values)

    // To string conversion

    override fun toString(): String =
        buildString {
            append(this@CollectionNbt.javaClass.simpleName)

            append('(')
            append(name.declaration())
            append("): ")

            append(values.size)
            append(if (values.size == 1) " entry" else " entries")

            if (values.isEmpty())
                return@buildString

            append("\n{\n")
            append(values.joinToString("\n").prependIndent("    "))
            append("\n}")
        }
}
