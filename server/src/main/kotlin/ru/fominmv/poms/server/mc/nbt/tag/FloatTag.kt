package ru.fominmv.poms.server.mc.nbt.tag

data class FloatTag(
    override val name:  String,
    override val value: Float,
) : ValueTag<Float>() {
    override fun toString(): String =
        super.toString() + "f"
}
