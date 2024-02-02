package ru.fominmv.poms.server.mc.nbt.tag

data class ByteArrayNBT(
    override val name:   String,
    override val values: List<Byte>,
) : ContainerNBT<Byte>() {
    override fun toString(): String =
        super.toString()
}
