package ru.fominmv.poms.server.mc.nbt.tag

data class LongNBT(
    override val name:  String,
    override val value: Long,
) : ValueNBT<Long>() {
    override fun toString(): String =
        super.toString() + "L"
}
