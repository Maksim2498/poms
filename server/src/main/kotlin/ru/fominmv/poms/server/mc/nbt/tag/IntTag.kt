package ru.fominmv.poms.server.mc.nbt.tag

data class IntTag(
    override val name:  String,
    override val value: Int,
) : ValueTag<Int>() {
    override fun toString(): String =
        super.toString()
}
