package ru.fominmv.poms.server.mc.protocol.nbt.tag

data class StringTag(
    override val name:  String,
    override val value: String,
) : ValueTag<String>() {
    override fun toString(): String =
        super.toString()
}
