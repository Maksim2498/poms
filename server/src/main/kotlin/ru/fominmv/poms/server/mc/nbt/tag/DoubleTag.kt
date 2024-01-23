package ru.fominmv.poms.server.mc.nbt.tag

data class DoubleTag(
    override val name:  String,
    override val value: Double,
) : ValueTag<Double>() {
    override fun toString(): String =
        super.toString()
}
