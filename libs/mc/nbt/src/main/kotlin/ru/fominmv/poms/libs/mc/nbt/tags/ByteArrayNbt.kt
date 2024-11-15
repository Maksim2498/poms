package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding a list of [Byte]s
 *
 * @param name the name of this NBT tag
 * @param values the values of this NBT tag
 *
 * @constructor Creates NBT tag with [name] and [values] specified
 */
data class ByteArrayNbt(
    override val name: String,
    override val values: List<Byte>,
) : CollectionNbt<List<Byte>>() {
    /**
     * Creates NBT tag with empty [name] and [values] specified
     */
    constructor(value: List<Byte>) : this("", value)

    override fun toString(): String =
        super.toString()
}
