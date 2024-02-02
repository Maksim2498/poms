package ru.fominmv.poms.server.mc.nbt.tag

data class StringNBT(
    override val name:  String,
    override val value: String,
) : ValueNBT<String>() {
    override fun toString(): String =
        super.toString()
}
