package ru.fominmv.poms.server.mc.nbt.tag

data class ShortNBT(
    override val name:  String,
    override val value: Short,
) : ValueNBT<Short>() {
    override fun toString(): String =
        super.toString()
}
