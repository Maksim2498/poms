package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding a [String] value
 *
 * @param name the name of this NBT tag
 * @param value the value of this NBT tag
 *
 * @constructor Creates NBT tag with [name] and [value] specified
 */
data class StringNbt(
    override val name: String,
    override val value: String,
) : ValueNbt<String>() {
    /**
     * Creates NBT tag with empty [name] and [value] specified
     */
    constructor(value: String) : this("", value)

    override fun toString(): String =
        super.toString()
}
