package ru.fominmv.poms.server.mc.protocol.nbt.tag

data class IntArrayTag(
    override val name:   String,
    override val values: List<Int>,
) : ContainerTag<Int>() {
    override fun toString(): String =
        super.toString()
}
