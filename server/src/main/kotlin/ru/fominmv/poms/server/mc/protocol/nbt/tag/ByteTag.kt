package ru.fominmv.poms.server.mc.protocol.nbt.tag

data class ByteTag(
    override val name:  String,
    override val value: Byte,
): ValueTag<Byte>() {
    override fun toString(): String =
        super.toString()
}
