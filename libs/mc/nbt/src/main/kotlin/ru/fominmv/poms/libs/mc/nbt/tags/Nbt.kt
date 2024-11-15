package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * A base interface for all classes representing NBT tags
 */
sealed interface Nbt {
    /**
     * A name of the NBT tag
     */
    val name: String
}
