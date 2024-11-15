package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A class representing NBT tag holding an [Int] value
 *
 * @param name the name of this NBT tag
 * @param value the value of this NBT tag
 *
 * @constructor Creates NBT tag with [name] and [value] specified
 */
data class IntNbt(
    override val name: String,
    override val value: Int,
) : ValueNbt<Int>() {
    /**
     * Creates NBT tag with empty [name] and [value] specified
     */
    constructor(value: Int) : this("", value)

    override fun toString(): String =
        super.toString()
}
