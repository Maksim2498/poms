package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding a [Short] value
 *
 * @param name the name of this NBT tag
 * @param value the value of this NBT tag
 *
 * @constructor Creates NBT tag with [name] and [value] specified
 */
data class ShortNbt(
    override val name: String,
    override val value: Short,
) : ValueNbt<Short>() {
    /**
     * Creates NBT tag with empty [name] and [value] specified
     */
    constructor(value: Short) : this("", value)

    override fun toString(): String =
        super.toString()
}
