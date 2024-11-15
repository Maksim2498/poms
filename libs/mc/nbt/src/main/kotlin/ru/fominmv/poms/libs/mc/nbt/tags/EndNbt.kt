package ru.fominmv.poms.libs.mc.nbt.tags

/**
 * Singleton representing an end of the NBT tag stream
 */
data object EndNbt : Nbt {
    /**
     * An empty string
     */
    override val name: String
        get() = ""

    override fun toString(): String =
        "${javaClass.simpleName}(\"\")"
}
