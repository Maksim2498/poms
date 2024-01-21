package ru.fominmv.poms.server.mc.protocol.nbt.tag

data class LongTag(
    override val name:  String,
    override val value: Long,
) : ValueTag<Long>() {
    override fun toString(): String =
        super.toString() + "L"
}
