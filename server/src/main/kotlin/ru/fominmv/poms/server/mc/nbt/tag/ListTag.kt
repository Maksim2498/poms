package ru.fominmv.poms.server.mc.nbt.tag

import java.util.*


@Suppress("RedundantModalityModifier")
final class ListTag<out T : Tag>(
    override val name:   String,
                 values: List<T>,
) : ContainerTag<T>() {
    override val values:      List<T>        = values.toList()
             val valuesClass: Class<out Tag> = this.values.firstOrNull()?.javaClass ?: EndTag::class.java

    init {
        if (this.values.any { it === EndTag })
            throw IllegalArgumentException("End tag is not allowed")

        if (this.values.any { it.javaClass != valuesClass })
            throw IllegalArgumentException("All tags must be of the same type")
    }

    fun component1(): String =
        name

    fun component2(): List<T> =
        values

    fun copy(
        name:   String                  = this.name,
        values: List<@UnsafeVariance T> = this.values,
    ): ListTag<T> =
        ListTag(name, values)

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as ListTag<*>

        return name   == other.name
            && values == other.values
    }

    override fun hashCode(): Int =
        Objects.hash(name, values)
}
