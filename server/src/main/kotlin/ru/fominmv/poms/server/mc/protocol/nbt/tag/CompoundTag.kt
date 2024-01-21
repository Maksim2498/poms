package ru.fominmv.poms.server.mc.protocol.nbt.tag

import java.util.*

@Suppress("RedundantModalityModifier")
final class CompoundTag(
    override val name:   String,
                 values: List<Tag>,
) : ContainerTag<Tag>() {
    override val values: List<Tag> = values.toList()

    init {
        if (this.values.any { it === EndTag })
            throw IllegalArgumentException("End tag is not allowed")
    }

    fun component1(): String =
        name

    fun component2(): List<Tag> =
        values

    fun copy(
        name:   String    = this.name,
        values: List<Tag> = this.values,
    ): CompoundTag =
        CompoundTag(name, values)

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as CompoundTag

        return name   == other.name
            && values == other.values
    }

    override fun hashCode(): Int =
        Objects.hash(name, values)
}
