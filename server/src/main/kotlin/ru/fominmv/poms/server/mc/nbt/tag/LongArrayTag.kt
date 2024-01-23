package ru.fominmv.poms.server.mc.nbt.tag

data class LongArrayTag(
    override val name:   String,
    override val values: List<Long>,
) : ContainerTag<Long>() {
    override fun toString(): String =
        super.toString()
}
