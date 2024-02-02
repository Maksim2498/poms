package ru.fominmv.poms.server.mc.nbt.tag

data class IntNBT(
    override val name:  String,
    override val value: Int,
) : ValueNBT<Int>() {
    override fun toString(): String =
        super.toString()
}
