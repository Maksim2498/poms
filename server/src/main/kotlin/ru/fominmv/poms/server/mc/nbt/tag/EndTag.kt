package ru.fominmv.poms.server.mc.nbt.tag

data object EndTag : Tag {
    override val name: String
        get() = ""

    override fun toString(): String =
        "${javaClass.simpleName}(\"\")"
}
