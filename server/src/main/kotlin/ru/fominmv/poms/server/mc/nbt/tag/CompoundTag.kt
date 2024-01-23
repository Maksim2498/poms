package ru.fominmv.poms.server.mc.nbt.tag

import java.util.*

@Suppress("RedundantModalityModifier")
final class CompoundTag(
    override val name:   String,
                 values: Collection<Tag>,
) : ContainerTag<Tag>() {
    val valuesMap: Map<String, Tag> = buildMap {
        values.forEach { put(it.name, it) }
    }

    override val values: Collection<Tag>
        get() = valuesMap.values

    init {
        if (this.values.any { it === EndTag })
            throw IllegalArgumentException("End tag is not allowed")
    }

    fun component1(): String =
        name

    fun component2(): Collection<Tag> =
        values

    fun copy(
        name:   String          = this.name,
        values: Collection<Tag> = this.values,
    ): CompoundTag =
        CompoundTag(name, values)

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as CompoundTag

        return name      == other.name
            && valuesMap == other.valuesMap
    }

    override fun hashCode(): Int =
        Objects.hash(name, valuesMap)
}
