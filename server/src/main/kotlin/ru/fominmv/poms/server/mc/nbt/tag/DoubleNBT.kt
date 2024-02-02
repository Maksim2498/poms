package ru.fominmv.poms.server.mc.nbt.tag

data class DoubleNBT(
    override val name:  String,
    override val value: Double,
) : ValueNBT<Double>() {
    override fun toString(): String =
        super.toString()
}
