package ru.fominmv.poms.server.mc.protocol.nbt.tag

data class DoubleTag(
    override val name:  String,
    override val value: Double,
) : ValueTag<Double>() {
    override fun toString(): String =
        super.toString()
}
