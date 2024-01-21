package ru.fominmv.poms.server.mc.protocol.nbt.tag

data class ByteArrayTag(
    override val name:   String,
    override val values: List<Byte>,
) : ContainerTag<Byte>() {
    override fun toString(): String =
        super.toString()
}
