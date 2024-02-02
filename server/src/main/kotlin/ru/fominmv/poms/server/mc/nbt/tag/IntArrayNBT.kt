package ru.fominmv.poms.server.mc.nbt.tag

data class IntArrayNBT(
    override val name:   String,
    override val values: List<Int>,
) : ContainerNBT<Int>() {
    override fun toString(): String =
        super.toString()
}
