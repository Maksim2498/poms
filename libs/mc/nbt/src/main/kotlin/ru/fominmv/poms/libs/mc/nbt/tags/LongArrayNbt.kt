package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding a list of [Long]s
 *
 * @param name the name of this NBT tag
 * @param values the values of this NBT tag
 *
 * @constructor Creates NBT tag with [name] and [values] specified
 */
data class LongArrayNbt(
    override val name: String,
    override val values: List<Long>,
) : CollectionNbt<List<Long>>() {
    /**
     * Creates NBT tag with empty [name] and [values] specified
     */
    constructor(values: List<Long>) : this("", values)

    override fun toString(): String =
        super.toString()
}
