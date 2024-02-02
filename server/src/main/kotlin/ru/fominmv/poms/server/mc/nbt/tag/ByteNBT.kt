package ru.fominmv.poms.server.mc.nbt.tag

data class ByteNBT(
    override val name:  String,
    override val value: Byte,
): ValueNBT<Byte>() {
    override fun toString(): String =
        super.toString()
}
