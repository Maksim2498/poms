package ru.fominmv.poms.server.mc.nbt.tag

data object EndNBT : NBT {
    override val name: String
        get() = ""

    override fun toString(): String =
        "${javaClass.simpleName}(\"\")"
}
