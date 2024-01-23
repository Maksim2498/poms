package ru.fominmv.poms.server.mc.nbt.tag

data class ShortTag(
    override val name:  String,
    override val value: Short,
) : ValueTag<Short>() {
    override fun toString(): String =
        super.toString()
}
