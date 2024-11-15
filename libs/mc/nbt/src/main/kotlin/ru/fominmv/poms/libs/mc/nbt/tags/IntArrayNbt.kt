package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding a list of [Int]s
 *
 * @param name the name of this NBT tag
 * @param values the values of this NBT tag
 *
 * @constructor Creates NBT tag with [name] and [values] specified
 */
data class IntArrayNbt(
    override val name: String,
    override val values: List<Int>,
) : CollectionNbt<List<Int>>() {
    /**
     * Creates NBT tag with empty [name] and [values] specified
     */
    constructor(values: List<Int>) : this("", values)

    override fun toString(): String =
        super.toString()
}
