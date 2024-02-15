package ru.fominmv.poms.server.mc.nbt.tag

import java.util.*

class ListNBT<out T : NBT>(
    override val name:   String,
                 values: List<T>,
) : ContainerNBT<T>() {
    override val values:      List<T>        = values.toList()
             val valuesClass: Class<out NBT> = this.values.firstOrNull()?.javaClass ?: EndNBT::class.java

    init {
        if (this.values.any { it === EndNBT })
            throw IllegalArgumentException("End tag is not allowed")

        if (this.values.any { it.javaClass != valuesClass })
            throw IllegalArgumentException("All tags must be of the same type")
    }

    operator fun component1(): String =
        name

    operator fun component2(): List<T> =
        values

    fun copy(
        name:   String                  = this.name,
        values: List<@UnsafeVariance T> = this.values,
    ): ListNBT<T> =
        ListNBT(name, values)

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as ListNBT<*>

        return name   == other.name
            && values == other.values
    }

    override fun hashCode(): Int =
        Objects.hash(name, values)
}
