package ru.fominmv.poms.server.mc.nbt.tag

data class FloatNBT(
    override val name:  String,
    override val value: Float,
) : ValueNBT<Float>() {
    override fun toString(): String =
        super.toString() + "f"
}
