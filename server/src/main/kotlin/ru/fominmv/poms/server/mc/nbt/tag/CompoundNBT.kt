package ru.fominmv.poms.server.mc.nbt.tag

import java.util.*

class CompoundNBT(
    override val name:   String,
                 values: Collection<NBT>,
) : ContainerNBT<NBT>() {
    val valuesMap: Map<String, NBT> = buildMap {
        values.forEach { put(it.name, it) }
    }

    override val values: Collection<NBT>
        get() = valuesMap.values

    init {
        if (this.values.any { it === EndNBT })
            throw IllegalArgumentException("End tag is not allowed")
    }

    operator fun component1(): String =
        name

    operator fun component2(): Collection<NBT> =
        values

    fun copy(
        name:   String          = this.name,
        values: Collection<NBT> = this.values,
    ): CompoundNBT =
        CompoundNBT(name, values)

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as CompoundNBT

        return name      == other.name
            && valuesMap == other.valuesMap
    }

    override fun hashCode(): Int =
        Objects.hash(name, valuesMap)
}
