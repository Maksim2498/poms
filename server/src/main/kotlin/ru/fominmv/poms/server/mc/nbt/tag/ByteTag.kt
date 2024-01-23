package ru.fominmv.poms.server.mc.nbt.tag

data class ByteTag(
    override val name:  String,
    override val value: Byte,
): ValueTag<Byte>() {
    override fun toString(): String =
        super.toString()
}
