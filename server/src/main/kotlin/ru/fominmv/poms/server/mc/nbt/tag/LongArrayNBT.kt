package ru.fominmv.poms.server.mc.nbt.tag

data class LongArrayNBT(
    override val name:   String,
    override val values: List<Long>,
) : ContainerNBT<Long>() {
    override fun toString(): String =
        super.toString()
}
